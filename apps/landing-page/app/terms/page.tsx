"use client";

import React from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { FooterSection } from "@/components/sections/footer/FooterSection";
import { Scale, BookOpen, CalendarCheck, HelpCircle, FileWarning } from "lucide-react";

export default function TermsPage() {
    return (
        <PageLayout forceScrolledState={true}>
            <main className="bg-[#fdfbf7] min-h-screen selection:bg-[#788069] selection:text-white">
                {/* Hero / Header Section */}
                <section className="relative h-[55vh] flex flex-col items-center justify-center pt-24 px-6 text-center border-b border-black/5">
                    <span className="text-[#788069] text-[10px] font-black tracking-[0.5em] uppercase mb-6 flex items-center gap-2">
                        <Scale size={12} /> Rules & Regulations
                    </span>
                    <h1 className="text-5xl md:text-7xl font-serif italic text-[#1a1a1a] mb-6">Syarat & Ketentuan</h1>
                    <p className="max-w-xl text-base md:text-lg font-light text-[#1a1a1a]/60 italic leading-relaxed">
                        Aturan dan pedoman resmi untuk menjamin keselamatan, kenyamanan, dan pengalaman menginap terbaik Anda di Bumi Anyom.
                    </p>
                </section>

                {/* Content Section */}
                <section className="max-w-4xl mx-auto px-6 py-24 md:py-32">
                    <div className="space-y-16">
                        
                        {/* Intro */}
                        <div className="space-y-4">
                            <p className="text-lg leading-relaxed text-[#1a1a1a]/80 font-light">
                                Selamat datang di Bumi Anyom. Dengan mengakses situs web kami, membuat pemesanan, atau menggunakan fasilitas akomodasi kami, Anda dianggap telah membaca, memahami, dan menyetujui seluruh ketentuan yang tercantum di bawah ini.
                            </p>
                            <p className="text-xs text-[#1a1a1a]/40 font-mono">Terakhir diperbarui: 4 Juni 2026</p>
                        </div>

                        <hr className="border-black/5" />

                        {/* Point 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                            <div className="md:col-span-4 flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#788069]/10 flex items-center justify-center text-[#788069] shrink-0">
                                    <BookOpen size={14} />
                                </div>
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#788069] pt-1">
                                    1. Reservasi & Pembayaran
                                </h2>
                            </div>
                            <div className="md:col-span-8 space-y-4 text-sm font-light leading-relaxed text-[#1a1a1a]/70">
                                <p>
                                    Seluruh pemesanan kamar harus dijamin dengan kartu kredit yang valid atau pembayaran deposit sesuai instruksi sistem booking kami.
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Tarif kamar yang tertera adalah dalam Rupiah (IDR) dan sudah termasuk pajak pemerintah serta biaya layanan yang berlaku, kecuali dinyatakan lain.</li>
                                    <li>Pembayaran penuh wajib diselesaikan saat proses check-in atau sesuai dengan ketentuan promosi tarif yang Anda pilih pada saat pemesanan.</li>
                                    <li>Kami berhak membatalkan reservasi secara sepihak apabila jaminan pembayaran tidak valid atau terjadi indikasi penipuan transaksi.</li>
                                </ul>
                            </div>
                        </div>

                        <hr className="border-black/5" />

                        {/* Point 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                            <div className="md:col-span-4 flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#788069]/10 flex items-center justify-center text-[#788069] shrink-0">
                                    <CalendarCheck size={14} />
                                </div>
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#788069] pt-1">
                                    2. Check-In & Check-Out
                                </h2>
                            </div>
                            <div className="md:col-span-8 space-y-4 text-sm font-light leading-relaxed text-[#1a1a1a]/70">
                                <p>
                                    Waktu standar operasional penerimaan tamu adalah sebagai berikut:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>**Check-In**: Mulai pukul 14:00 WIB. Tamu wajib menunjukkan kartu identitas resmi yang berfoto (KTP/Paspor) saat pendaftaran.</li>
                                    <li>**Check-Out**: Maksimal pukul 12:00 WIB.</li>
                                    <li>Permintaan check-in lebih awal (early check-in) atau check-out terlambat (late check-out) bergantung pada ketersediaan kamar dan dapat dikenakan biaya tambahan sesuai kebijakan hotel.</li>
                                </ul>
                            </div>
                        </div>

                        <hr className="border-black/5" />

                        {/* Point 3 */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                            <div className="md:col-span-4 flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#788069]/10 flex items-center justify-center text-[#788069] shrink-0">
                                    <FileWarning size={14} />
                                </div>
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#788069] pt-1">
                                    3. Kebijakan Pembatalan
                                </h2>
                            </div>
                            <div className="md:col-span-8 space-y-4 text-sm font-light leading-relaxed text-[#1a1a1a]/70">
                                <p>
                                    Kebijakan pembatalan bervariasi berdasarkan jenis paket dan tarif kamar yang Anda pesan:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Untuk tarif standar (fleksibel), pembatalan yang dilakukan kurang dari 48 jam sebelum tanggal kedatangan akan dikenakan biaya sebesar malam pertama sewa kamar.</li>
                                    <li>Untuk tarif non-refundable (tidak dapat diubah/dibatalkan), pembayaran penuh yang telah didepositkan tidak dapat dikembalikan dengan alasan apa pun, termasuk jika Anda tidak datang (no-show).</li>
                                </ul>
                            </div>
                        </div>

                        <hr className="border-black/5" />

                        {/* Point 4 */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                            <div className="md:col-span-4 flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#788069]/10 flex items-center justify-center text-[#788069] shrink-0">
                                    <HelpCircle size={14} />
                                </div>
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#788069] pt-1">
                                    4. Tata Tertib Selama Menginap
                                </h2>
                            </div>
                            <div className="md:col-span-8 space-y-4 text-sm font-light leading-relaxed text-[#1a1a1a]/70">
                                <p>
                                    Demi kenyamanan bersama seluruh tamu Bumi Anyom, Anda diwajibkan untuk mematuhi tata tertib berikut:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>**Ketenangan**: Tamu dilarang membuat kegaduhan atau memainkan musik dengan volume keras setelah pukul 22:00 WIB.</li>
                                    <li>**Kerusakan**: Tamu bertanggung jawab penuh atas segala kerusakan atau hilangnya inventaris kamar yang disebabkan oleh kelalaian pribadi maupun tamu kunjungan Anda. Biaya ganti rugi akan dibebankan pada tagihan akhir Anda.</li>
                                    <li>**Larangan**: Dilarang keras membawa hewan peliharaan, senjata tajam, bahan peledak, zat narkotika, serta melakukan aktivitas ilegal di seluruh area properti Bumi Anyom.</li>
                                </ul>
                            </div>
                        </div>

                    </div>
                </section>

                <FooterSection />
            </main>
        </PageLayout>
    );
}
