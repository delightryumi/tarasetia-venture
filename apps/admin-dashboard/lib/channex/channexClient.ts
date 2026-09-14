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
    private baseUrl: string;
    private apiKey: string;

    constructor(apiKey?: string, isProduction?: boolean) {
        const env = process.env.CHANNEX_ENV || (isProduction ? "production" : "staging");
        this.baseUrl = env === "production" 
            ? "https://api.channex.io/api/v1" 
            : "https://staging.channex.io/api/v1";
            
        this.apiKey = apiKey || process.env.CHANNEX_API_KEY || "";
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

    private async request<T>(endpoint: string, options: RequestInit = {}, customApiKey?: string): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const headers = { ...this.getHeaders(customApiKey), ...(options.headers as any) };

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorMsg = data?.errors?.title || data?.errors?.details || data?.meta?.message || response.statusText;
                console.error(`[Channex API Error] ${response.status} ${url}:`, JSON.stringify(data));
                throw new Error(`Channex Error (${response.status}): ${typeof errorMsg === 'string' ? errorMsg : JSON.stringify(errorMsg)}`);
            }

            return data as T;
        } catch (error: any) {
            console.error(`[Channex Network/Client Error] ${url}:`, error.message);
            throw error;
        }
    }

    // ==========================================
    // 1. PROPERTY MANAGEMENT
    // ==========================================

    async getProperties(customApiKey?: string): Promise<any> {
        return this.request<{ data: any[] }>("/properties", { method: "GET" }, customApiKey);
    }

    async getProperty(propertyId: string, customApiKey?: string): Promise<any> {
        return this.request<{ data: any }>(`/properties/${propertyId}`, { method: "GET" }, customApiKey);
    }

    async createProperty(property: Partial<ChannexProperty>, customApiKey?: string): Promise<any> {
        return this.request<{ data: any }>("/properties", {
            method: "POST",
            body: JSON.stringify({ property })
        }, customApiKey);
    }

    // ==========================================
    // 2. ROOM TYPES MANAGEMENT
    // ==========================================

    async getRoomTypes(propertyId: string, customApiKey?: string): Promise<any> {
        return this.request<{ data: any[] }>(`/room_types?filter[property_id]=${propertyId}`, { method: "GET" }, customApiKey);
    }

    async createRoomType(roomType: Partial<ChannexRoomType>, customApiKey?: string): Promise<any> {
        return this.request<{ data: any }>("/room_types", {
            method: "POST",
            body: JSON.stringify({ room_type: roomType })
        }, customApiKey);
    }

    // ==========================================
    // 3. RATE PLANS MANAGEMENT
    // ==========================================

    async getRatePlans(propertyId: string, customApiKey?: string): Promise<any> {
        return this.request<{ data: any[] }>(`/rate_plans?filter[property_id]=${propertyId}`, { method: "GET" }, customApiKey);
    }

    async createRatePlan(ratePlan: Partial<ChannexRatePlan>, customApiKey?: string): Promise<any> {
        return this.request<{ data: any }>("/rate_plans", {
            method: "POST",
            body: JSON.stringify({ rate_plan: ratePlan })
        }, customApiKey);
    }

    // ==========================================
    // 4. ARI: AVAILABILITY & RESTRICTIONS (PUSH)
    // ==========================================

    /**
     * Push Availability updates to Channex (High Priority Queue)
     */
    async pushAvailability(payload: ChannexAvailabilityPayload, customApiKey?: string): Promise<any> {
        return this.request<{ data: any; meta: any }>("/availability", {
            method: "POST",
            body: JSON.stringify(payload)
        }, customApiKey);
    }

    /**
     * Push Rates, Minimum Stay, and Restrictions updates to Channex
     */
    async pushRestrictions(payload: ChannexRestrictionsPayload, customApiKey?: string): Promise<any> {
        return this.request<{ data: any; meta: any }>("/restrictions", {
            method: "POST",
            body: JSON.stringify(payload)
        }, customApiKey);
    }

    // ==========================================
    // 5. WHITE-LABEL CHANNEL MAPPING IFRAME
    // ==========================================

    /**
     * Generates a One-Time Access Token to render the Channex Channel Mapping screen inside an iframe
     */
    async createOneTimeToken(propertyId: string, username: string = "Admin", customApiKey?: string): Promise<{ token: string; iframeUrl: string }> {
        const res = await this.request<{ data: { token: string }; meta: any }>("/auth/one_time_token", {
            method: "POST",
            body: JSON.stringify({
                one_time_token: {
                    property_id: propertyId,
                    username
                }
            })
        }, customApiKey);

        const token = res?.data?.token || "";
        const iframeHost = this.baseUrl.replace("/api/v1", "");
        const iframeUrl = `${iframeHost}/auth/exchange?oauth_session_key=${token}&app_mode=headless&redirect_to=/channels&property_id=${propertyId}&allow_notifications_edit=false`;

        return {
            token,
            iframeUrl
        };
    }

    // ==========================================
    // 6. GLOBAL WEBHOOK CONFIGURATION
    // ==========================================

    /**
     * Registers a Global Webhook that routes booking and ARI events across all 12 properties to My Tara
     */
    async registerGlobalWebhook(callbackUrl: string, secretToken: string, customApiKey?: string): Promise<any> {
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
        }, customApiKey);
    }

    /**
     * Acknowledge receiving a booking revision so it won't be redelivered
     */
    async acknowledgeBooking(bookingRevisionId: string, customApiKey?: string): Promise<any> {
        return this.request<{ meta: any }>(`/booking_revisions/${bookingRevisionId}/ack`, {
            method: "POST"
        }, customApiKey);
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
}

// Singleton helper instance
export const channexClient = new ChannexClient();
