/**
 * Channex.io REST API Client
 * Built for My Tara Multi-Hotel CRS (Setara Venture)
 */

import {
    ChannexProperty,
    ChannexRoomType,
    ChannexRatePlan,
    ChannexAvailabilityPayload,
    ChannexRestrictionsPayload
} from "./types";

export class ChannexClient {
    private defaultBaseUrl: string;
    private apiKey: string;

    constructor(apiKey?: string, isProduction?: boolean) {
        const env = process.env.CHANNEX_ENV || (isProduction ? "production" : "staging");
        this.defaultBaseUrl = env === "production" 
            ? "https://app.channex.io/api/v1" 
            : "https://staging.channex.io/api/v1";
            
        this.apiKey = apiKey || process.env.CHANNEX_API_KEY || "";
    }

    public getBaseUrl(environment?: "staging" | "production"): string {
        if (environment) {
            return environment === "production"
                ? "https://app.channex.io/api/v1"
                : "https://staging.channex.io/api/v1";
        }
        return this.defaultBaseUrl;
    }

    private getHeaders(customApiKey?: string): Record<string, string> {
        const key = customApiKey || this.apiKey;
        if (!key) {
            console.warn("[ChannexClient] Warning: API key is not configured. Using mock/dry-run mode.");
        }
        return {
            "Content-Type": "application/json",
            "user-api-key": key,
            "Accept": "application/json"
        };
    }

    /**
     * Executes HTTP Request with Exponential Backoff Retry (Channex Outbox Standard for 429 & 5xx)
     */
    private async request<T>(
        endpoint: string, 
        options: RequestInit = {}, 
        customApiKey?: string,
        environment?: "staging" | "production"
    ): Promise<T> {
        const baseUrl = this.getBaseUrl(environment);
        const url = `${baseUrl}${endpoint}`;
        const headers = { ...this.getHeaders(customApiKey), ...(options.headers as any) };

        const maxRetries = 3;
        let attempt = 0;

        while (attempt <= maxRetries) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers
                });

                const data = await response.json().catch(() => ({}));

                // Log any warnings emitted by Channex in 200 OK responses
                if (data?.meta?.warnings && Array.isArray(data.meta.warnings) && data.meta.warnings.length > 0) {
                    console.warn(`[Channex API Warning] ${url}:`, JSON.stringify(data.meta.warnings));
                }

                // Handle rate-limiting (429) or transient server errors (5xx) with exponential backoff
                if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
                    const delayMs = Math.pow(2, attempt) * 1000 + Math.floor(Math.random() * 300);
                    console.warn(`[ChannexClient] Received HTTP ${response.status} from ${url}. Retrying in ${delayMs}ms (Attempt ${attempt + 1}/${maxRetries})...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    attempt++;
                    continue;
                }

                if (!response.ok) {
                    const errorMsg = data?.errors?.title || data?.errors?.details || data?.meta?.message || response.statusText;
                    console.error(`[Channex API Error] ${response.status} ${url}:`, JSON.stringify(data));
                    throw new Error(`Channex Error (${response.status}): ${typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}`);
                }

                return data as T;
            } catch (error: any) {
                if (attempt < maxRetries && error.name !== "AbortError" && !error.message?.includes("Channex Error (4")) {
                    const delayMs = Math.pow(2, attempt) * 1000;
                    console.warn(`[ChannexClient] Network error on ${url}: ${error.message}. Retrying in ${delayMs}ms...`);
                    await new Promise(resolve => setTimeout(resolve, delayMs));
                    attempt++;
                    continue;
                }
                console.error(`[Channex Network/Client Error] ${url}:`, error.message);
                throw error;
            }
        }

        throw new Error(`Channex request to ${url} failed after ${maxRetries} retries.`);
    }

    // ==========================================
    // 1. PROPERTY MANAGEMENT
    // ==========================================

    async getProperties(customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any[] }>("/properties", { method: "GET" }, customApiKey, environment);
    }

    async getProperty(propertyId: string, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any }>(`/properties/${propertyId}`, { method: "GET" }, customApiKey, environment);
    }

    async createProperty(property: Partial<ChannexProperty>, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any }>("/properties", {
            method: "POST",
            body: JSON.stringify({ property })
        }, customApiKey, environment);
    }

    // ==========================================
    // 2. ROOM TYPES MANAGEMENT
    // ==========================================

    async getRoomTypes(propertyId: string, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any[] }>(`/room_types?filter[property_id]=${propertyId}`, { method: "GET" }, customApiKey, environment);
    }

    async createRoomType(roomType: Partial<ChannexRoomType>, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any }>("/room_types", {
            method: "POST",
            body: JSON.stringify({ room_type: roomType })
        }, customApiKey, environment);
    }

    // ==========================================
    // 3. RATE PLANS MANAGEMENT
    // ==========================================

    async getRatePlans(propertyId: string, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any[] }>(`/rate_plans?filter[property_id]=${propertyId}`, { method: "GET" }, customApiKey, environment);
    }

    async createRatePlan(ratePlan: Partial<ChannexRatePlan>, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any }>("/rate_plans", {
            method: "POST",
            body: JSON.stringify({ rate_plan: ratePlan })
        }, customApiKey, environment);
    }

    // ==========================================
    // 4. ARI: AVAILABILITY & RESTRICTIONS (PUSH)
    // ==========================================

    /**
     * Push Availability updates to Channex (High Priority Queue)
     */
    async pushAvailability(payload: ChannexAvailabilityPayload, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any; meta: any }>("/availability", {
            method: "POST",
            body: JSON.stringify(payload)
        }, customApiKey, environment);
    }

    /**
     * Push Rates, Minimum Stay, and Restrictions updates to Channex
     */
    async pushRestrictions(payload: ChannexRestrictionsPayload, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any; meta: any }>("/restrictions", {
            method: "POST",
            body: JSON.stringify(payload)
        }, customApiKey, environment);
    }

    /**
     * Read back Availability per Room Type (for verification / audit)
     * URL: GET /availability?filter[property_id]=UUID&filter[date][gte]=YYYY-MM-DD&filter[date][lte]=YYYY-MM-DD
     */
    async getAvailability(
        propertyId: string, 
        dateFrom: string, 
        dateTo: string, 
        customApiKey?: string, 
        environment?: "staging" | "production"
    ): Promise<any> {
        const query = `/availability?filter[property_id]=${propertyId}&filter[date][gte]=${dateFrom}&filter[date][lte]=${dateTo}`;
        return this.request<{ data: Record<string, Record<string, number>> }>(query, { method: "GET" }, customApiKey, environment);
    }

    /**
     * Read back Rates & Restrictions per Rate Plan (filter[restrictions] is MANDATORY in Channex)
     * URL: GET /restrictions?filter[property_id]=UUID&filter[date][gte]=...&filter[date][lte]=...&filter[restrictions]=...
     */
    async getRestrictions(
        propertyId: string, 
        dateFrom: string, 
        dateTo: string, 
        restrictions: string[] | string = ["rate", "min_stay_arrival", "stop_sell"], 
        customApiKey?: string, 
        environment?: "staging" | "production"
    ): Promise<any> {
        const restrParam = Array.isArray(restrictions) ? restrictions.join(",") : restrictions;
        const query = `/restrictions?filter[property_id]=${propertyId}&filter[date][gte]=${dateFrom}&filter[date][lte]=${dateTo}&filter[restrictions]=${restrParam}`;
        return this.request<{ data: Record<string, Record<string, any>> }>(query, { method: "GET" }, customApiKey, environment);
    }

    // ==========================================
    // 5. WHITE-LABEL CHANNEL MAPPING IFRAME
    // ==========================================

    /**
     * Generates a One-Time Access Token to render the Channex Channel Mapping screen inside an iframe
     */
    async createOneTimeToken(
        propertyId: string, 
        username: string = "Admin", 
        customApiKey?: string,
        environment?: "staging" | "production"
    ): Promise<{ token: string; iframeUrl: string }> {
        const res = await this.request<{ data: { token: string }; meta: any }>("/auth/one_time_token", {
            method: "POST",
            body: JSON.stringify({
                one_time_token: {
                    property_id: propertyId,
                    username
                }
            })
        }, customApiKey, environment);

        const token = res?.data?.token || "";
        const isProd = environment === "production" || (!environment && this.defaultBaseUrl.includes("api.channex.io"));
        const iframeHost = isProd ? "https://app.channex.io" : "https://staging.channex.io";
        const iframeUrl = `${iframeHost}/auth/exchange?oauth_session_key=${token}&app_mode=headless&redirect_to=/channels&property_id=${propertyId}&allow_notifications_edit=false`;

        return {
            token,
            iframeUrl
        };
    }

    // ==========================================
    // 6. GLOBAL WEBHOOK & BOOKING FEED CONFIGURATION
    // ==========================================

    /**
     * Registers a Global Webhook that routes booking and ARI events across all 12 properties to My Tara
     */
    async registerGlobalWebhook(
        callbackUrl: string, 
        secretToken: string, 
        customApiKey?: string,
        environment?: "staging" | "production"
    ): Promise<any> {
        return this.request<{ data: any }>("/webhooks", {
            method: "POST",
            body: JSON.stringify({
                webhook: {
                    callback_url: callbackUrl,
                    event_mask: "*",
                    property_id: null,
                    is_global: true,
                    is_active: true,
                    send_data: true,
                    headers: {
                        "X-Channex-Webhook-Secret": secretToken
                    }
                }
            })
        }, customApiKey, environment);
    }

    /**
     * Pulls unacknowledged booking revisions from Channex Booking Feed (Certification Stage 5 Requirement)
     * URL: GET /api/v1/booking_revisions/feed
     */
    async getBookingRevisionFeed(
        customApiKey?: string,
        environment?: "staging" | "production"
    ): Promise<any> {
        return this.request<{ data: any[]; meta: any }>("/booking_revisions/feed", {
            method: "GET"
        }, customApiKey, environment);
    }

    /**
     * Acknowledge receiving a booking revision so it won't be redelivered
     */
    async acknowledgeBooking(
        bookingRevisionId: string, 
        customApiKey?: string,
        environment?: "staging" | "production"
    ): Promise<any> {
        return this.request<{ meta: any }>(`/booking_revisions/${bookingRevisionId}/ack`, {
            method: "POST"
        }, customApiKey, environment);
    }

    /**
     * Pull single authoritative booking revision by ID (used for Webhook Hydration: notification payload -> pull source of truth)
     * URL: GET /api/v1/booking_revisions/:id
     */
    async getBookingRevision(
        bookingRevisionId: string,
        customApiKey?: string,
        environment?: "staging" | "production"
    ): Promise<any> {
        return this.request<{ data: any }>(`/booking_revisions/${bookingRevisionId}`, {
            method: "GET"
        }, customApiKey, environment);
    }

    /**
     * Manual Time-Scoped Booking Recovery (used after >30min outage to backfill missed revisions)
     * URL: GET /api/v1/bookings?filter[inserted_at][gte]=<outage_start>&...
     */
    async getBookings(
        filter: {
            propertyId?: string;
            insertedAtGte?: string;
            arrivalDateGte?: string;
            departureDateLte?: string;
            limit?: number;
            page?: number;
        } = {},
        customApiKey?: string,
        environment?: "staging" | "production"
    ): Promise<any> {
        const params = new URLSearchParams();
        if (filter.propertyId) params.append("filter[property_id]", filter.propertyId);
        if (filter.insertedAtGte) params.append("filter[inserted_at][gte]", filter.insertedAtGte);
        if (filter.arrivalDateGte) params.append("filter[arrival_date][gte]", filter.arrivalDateGte);
        if (filter.departureDateLte) params.append("filter[departure_date][lte]", filter.departureDateLte);
        if (filter.limit) params.append("limit", String(filter.limit));
        if (filter.page) params.append("page", String(filter.page));

        const query = `/bookings?${params.toString()}`;
        return this.request<{ data: any[]; meta: any }>(query, {
            method: "GET"
        }, customApiKey, environment);
    }

    // ==========================================
    // 7. UNIFIED GUEST MESSAGING API
    // ==========================================

    async getMessageThreads(propertyId: string, customApiKey?: string): Promise<any> {
        return this.request<{ data: any[] }>(`/message_threads?filter[property_id]=${propertyId}`, { method: "GET" }, customApiKey);
    }

    async getMessages(threadId: string, customApiKey?: string): Promise<any> {
        return this.request<{ data: any[] }>(`/message_threads/${threadId}/messages`, { method: "GET" }, customApiKey);
    }

    async sendMessage(threadId: string, message: string, customApiKey?: string): Promise<any> {
        return this.request<{ data: any }>(`/message_threads/${threadId}/messages`, {
            method: "POST",
            body: JSON.stringify({
                message: {
                    message,
                    sender: "property"
                }
            })
        }, customApiKey);
    }

    // ==========================================
    // 8. UNIFIED OTA GUEST REVIEWS API
    // ==========================================

    async getReviews(propertyId: string, customApiKey?: string): Promise<any> {
        return this.request<{ data: any[] }>(`/reviews?filter[property_id]=${propertyId}`, { method: "GET" }, customApiKey);
    }

    async replyReview(reviewId: string, replyContent: string, customApiKey?: string): Promise<any> {
        return this.request<{ data: any }>(`/reviews/${reviewId}/reply`, {
            method: "POST",
            body: JSON.stringify({
                reply: {
                    content: replyContent
                }
            })
        }, customApiKey);
    }

    // ==========================================
    // 9. CHANNEL AVAILABILITY RULES (YIELD / QUOTA OVERRIDES)
    // ==========================================

    async getAvailabilityRules(propertyId: string, customApiKey?: string): Promise<any> {
        return this.request<{ data: any[] }>(`/channel_availability_rules?filter[property_id]=${propertyId}`, { method: "GET" }, customApiKey);
    }

    async createAvailabilityRule(payload: any, customApiKey?: string): Promise<any> {
        return this.request<{ data: any }>("/channel_availability_rules", {
            method: "POST",
            body: JSON.stringify({ channel_availability_rule: payload })
        }, customApiKey);
    }

    async deleteAvailabilityRule(ruleId: string, customApiKey?: string): Promise<any> {
        return this.request<{ meta: any }>(`/channel_availability_rules/${ruleId}`, {
            method: "DELETE"
        }, customApiKey);
    }

    // ==========================================
    // 10. REAL-TIME TASK & CHANNEL LOGS API
    // ==========================================

    async getTasks(propertyId: string, customApiKey?: string): Promise<any> {
        return this.request<{ data: any[] }>(`/tasks?filter[property_id]=${propertyId}&order_by=inserted_at&order_direction=desc&limit=25`, { method: "GET" }, customApiKey);
    }

    async getChannelLogs(propertyId: string, customApiKey?: string): Promise<any> {
        return this.request<{ data: any[] }>(`/channel_actions_log?filter[property_id]=${propertyId}&limit=25`, { method: "GET" }, customApiKey);
    }

    // ==========================================
    // 11. TAXES & SERVICE CHARGE SETS
    // ==========================================

    async getTaxes(propertyId: string, customApiKey?: string): Promise<any> {
        return this.request<{ data: any[] }>(`/tax_sets?filter[property_id]=${propertyId}`, { method: "GET" }, customApiKey);
    }

    async createTaxSet(payload: any, customApiKey?: string): Promise<any> {
        return this.request<{ data: any }>("/tax_sets", {
            method: "POST",
            body: JSON.stringify({ tax_set: payload })
        }, customApiKey);
    }

    // ==========================================
    // 12. PHOTOS & FACILITIES CONTENT DISTRIBUTION
    // ==========================================

    async pushFacilities(propertyId: string, facilities: string[], customApiKey?: string): Promise<any> {
        return this.request<{ data: any }>(`/properties/${propertyId}/facilities`, {
            method: "PUT",
            body: JSON.stringify({ facilities })
        }, customApiKey);
    }

    async pushPhotos(propertyId: string, photos: any[], customApiKey?: string): Promise<any> {
        return this.request<{ data: any }>(`/properties/${propertyId}/photos`, {
            method: "POST",
            body: JSON.stringify({ photos })
        }, customApiKey);
    }

    // ==========================================
    // 13. PCI VIRTUAL CREDIT CARD (VCC) ACCESS
    // ==========================================

    async createPciCardViewToken(bookingId: string, customApiKey?: string): Promise<any> {
        return this.request<{ data: { session_token: string; url: string } }>(`/bookings/${bookingId}/pci_view`, {
            method: "POST"
        }, customApiKey);
    }

    // ==========================================
    // 14. CHANNELS (OTA INTEGRATIONS)
    // ==========================================

    /**
     * Get list of connected channels for a property in Channex
     */
    async getChannels(propertyId: string, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any[]; meta: any }>(`/channels?filter[property_id]=${propertyId}`, { method: "GET" }, customApiKey, environment);
    }

    /**
     * Get single channel details from Channex
     */
    async getChannel(channelId: string, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any }>(`/channels/${channelId}`, { method: "GET" }, customApiKey, environment);
    }

    /**
     * Get list of supported OTA channel adapters in Channex
     */
    async getChannelAdapters(customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any[] }>("/channels/list", { method: "GET" }, customApiKey, environment);
    }

    /**
     * Get adapter schema and parameter requirements for a specific channel code
     */
    async getChannelAdapter(code: string, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any }>(`/channels/adapter?code=${code}`, { method: "GET" }, customApiKey, environment);
    }

    /**
     * Test connection credentials against an OTA before creating
     * Official Channex Specification: POST /api/v1/channels/test_connection
     * Payload: { channel: adapter_code, settings: { ... } }
     */
    async testChannelConnection(channelCode: string, settings: any, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any; meta: any }>("/channels/test_connection", {
            method: "POST",
            body: JSON.stringify({
                channel: channelCode,
                settings
            })
        }, customApiKey, environment);
    }

    /**
     * Retrieve the mapping details of a channel (rooms and rates exposed by the OTA)
     * Official Channex Specification: POST /api/v1/channels/mapping_details
     */
    async getChannelMappingDetails(channelCode: string, settings: any, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any }>("/channels/mapping_details", {
            method: "POST",
            body: JSON.stringify({
                channel: channelCode,
                settings
            })
        }, customApiKey, environment);
    }

    /**
     * Retrieve the connection details of a channel (currency and connection states)
     * Official Channex Specification: POST /api/v1/channels/connection_details
     */
    async getChannelConnectionDetails(channelCode: string, settings: any, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any }>("/channels/connection_details", {
            method: "POST",
            body: JSON.stringify({
                channel: channelCode,
                settings
            })
        }, customApiKey, environment);
    }

    /**
     * Check readiness of a channel connection before activation
     * Official Channex Specification: POST /api/v1/channels/{id}/check_readiness
     */
    async checkChannelReadiness(channelId: string, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any }>(`/channels/${channelId}/check_readiness`, {
            method: "POST"
        }, customApiKey, environment);
    }

    /**
     * Create channel connection in Channex
     */
    async createChannel(payload: any, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any }>("/channels", {
            method: "POST",
            body: JSON.stringify({ channel: payload })
        }, customApiKey, environment);
    }

    /**
     * Update existing channel in Channex
     */
    async updateChannel(channelId: string, payload: any, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any }>(`/channels/${channelId}`, {
            method: "PUT",
            body: JSON.stringify({ channel: payload })
        }, customApiKey, environment);
    }

    /**
     * Activate channel connection in Channex to begin ARI and Booking synchronization
     */
    async activateChannel(channelId: string, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any; meta: any }>(`/channels/${channelId}`, {
            method: "PUT",
            body: JSON.stringify({ channel: { is_active: true } })
        }, customApiKey, environment);
    }

    /**
     * Deactivate channel connection in Channex
     */
    async deactivateChannel(channelId: string, customApiKey?: string, environment?: "staging" | "production"): Promise<any> {
        return this.request<{ data: any; meta: any }>(`/channels/${channelId}`, {
            method: "PUT",
            body: JSON.stringify({ channel: { is_active: false } })
        }, customApiKey, environment);
    }
}

// Singleton helper instance
export const channexClient = new ChannexClient();
