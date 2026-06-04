"use client";

import React from "react";
import { PageLayout } from "@/components/layout/PageLayout";
import { FooterSection } from "@/components/sections/footer/FooterSection";
import { Shield, Eye, Lock, FileText, ChevronRight } from "lucide-react";

export default function PrivacyPage() {
    return (
        <PageLayout>
            <main className="bg-[#fdfbf7] min-h-screen selection:bg-[#788069] selection:text-white">
                {/* Hero / Header Section */}
                <section className="relative h-[55vh] flex flex-col items-center justify-center pt-24 px-6 text-center border-b border-black/5">
                    <span className="text-[#788069] text-[10px] font-black tracking-[0.5em] uppercase mb-6 flex items-center gap-2">
                        <Shield size={12} /> Legal Documents
                    </span>
                    <h1 className="text-5xl md:text-7xl font-serif italic text-[#1a1a1a] mb-6">Kebijakan Privasi</h1>
                    <p className="max-w-xl text-base md:text-lg font-light text-[#1a1a1a]/60 italic leading-relaxed">
                        Komitmen kami untuk melindungi dan menghormati privasi data pribadi Anda selama berinteraksi dan menginap di Bumi Anyom.
                    </p>
                </section>

                {/* Content Section */}
                <section className="max-w-4xl mx-auto px-6 py-24 md:py-32">
                    <div className="space-y-16">
                        
                        {/* Intro */}
                        <div className="space-y-4">
                            <p className="text-lg leading-relaxed text-[#1a1a1a]/80 font-light">
                                Bumi Anyom ("kami") menghargai privasi Anda dan berkomitmen untuk melindungi Data Pribadi Anda. Kebijakan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, menyimpan, dan memproses data pribadi Anda ketika Anda mengunjungi situs web kami, membuat reservasi, atau menggunakan layanan hospitality kami.
                            </p>
                            <p className="text-xs text-[#1a1a1a]/40 font-mono">Terakhir diperbarui: 4 Juni 2026</p>
                        </div>

                        <hr className="border-black/5" />

                        {/* Point 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                            <div className="md:col-span-4 flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#788069]/10 flex items-center justify-center text-[#788069] shrink-0">
                                    <Eye size={14} />
                                </div>
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#788069] pt-1">
                                    1. Data yang Kami Kumpulkan
                                </h2>
                            </div>
                            <div className="md:col-span-8 space-y-4 text-sm font-light leading-relaxed text-[#1a1a1a]/70">
                                <p>
                                    Kami mengumpulkan informasi yang Anda berikan secara langsung kepada kami, termasuk namun tidak terbatas pada:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Data Identitas: Nama lengkap, kartu identitas (KTP/Paspor), tanggal lahir, jenis kelamin.</li>
                                    <li>Data Kontak: Alamat email, nomor telepon, alamat penagihan/domisili.</li>
                                    <li>Data Transaksi & Reservasi: Tanggal menginap, detail kamar yang dipesan, kebutuhan khusus, informasi pembayaran (kartu kredit/rekening bank).</li>
                                    <li>Data Teknis: Alamat IP, data log peramban, preferensi cookie, dan informasi analitik kunjungan situs.</li>
                                </ul>
                            </div>
                        </div>

                        <hr className="border-black/5" />

                        {/* Point 2 */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                            <div className="md:col-span-4 flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#788069]/10 flex items-center justify-center text-[#788069] shrink-0">
                                    <FileText size={14} />
                                </div>
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#788069] pt-1">
                                    2. Penggunaan Informasi
                                </h2>
                            </div>
                            <div className="md:col-span-8 space-y-4 text-sm font-light leading-relaxed text-[#1a1a1a]/70">
                                <p>
                                    Kami menggunakan data pribadi Anda untuk tujuan-tujuan berikut:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Memproses dan mengonfirmasi pemesanan kamar serta layanan tambahan Anda.</li>
                                    <li>Menyediakan layanan hospitality personal dan menanggapi permintaan khusus Anda selama menginap.</li>
                                    <li>Mengelola pembayaran, pengembalian dana, dan verifikasi identitas keuangan.</li>
                                    <li>Mengirimkan informasi administratif, pembaruan kebijakan, serta promosi atau penawaran khusus (apabila Anda memilih untuk menerimanya).</li>
                                    <li>Memenuhi kewajiban hukum lokal dan peraturan otoritas pariwisata/keamanan.</li>
                                </ul>
                            </div>
                        </div>

                        <hr className="border-black/5" />

                        {/* Point 3 */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                            <div className="md:col-span-4 flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#788069]/10 flex items-center justify-center text-[#788069] shrink-0">
                                    <Lock size={14} />
                                </div>
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#788069] pt-1">
                                    3. Perlindungan & Keamanan
                                </h2>
                            </div>
                            <div className="md:col-span-8 space-y-4 text-sm font-light leading-relaxed text-[#1a1a1a]/70">
                                <p>
                                    Kami mengimplementasikan langkah-langkah keamanan teknis dan organisasional yang ketat untuk mencegah akses tanpa izin, kehilangan, perubahan, atau penyalahgunaan data pribadi Anda. 
                                </p>
                                <p>
                                    Seluruh transaksi online diproses menggunakan enkripsi standar industri yang aman. Namun, perlu dipahami bahwa tidak ada metode transmisi data melalui internet yang 100% aman secara mutlak.
                                </p>
                            </div>
                        </div>

                        <hr className="border-black/5" />

                        {/* Point 4 */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
                            <div className="md:col-span-4 flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-[#788069]/10 flex items-center justify-center text-[#788069] shrink-0">
                                    <Shield size={14} />
                                </div>
                                <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#788069] pt-1">
                                    4. Hak-Hak Anda
                                </h2>
                            </div>
                            <div className="md:col-span-8 space-y-4 text-sm font-light leading-relaxed text-[#1a1a1a]/70">
                                <p>
                                    Sebagai pemilik data pribadi, Anda memiliki hak-hak perlindungan data berikut:
                                </p>
                                <ul className="list-disc pl-5 space-y-2">
                                    <li>Hak untuk mengakses, memperbarui, atau memperbaiki kesalahan informasi pribadi Anda.</li>
                                    <li>Hak untuk meminta penghapusan data pribadi Anda ("hak untuk dilupakan") setelah seluruh masa inap dan transaksi terselesaikan.</li>
                                    <li>Hak untuk menarik kembali persetujuan pengolahan data untuk kebutuhan pemasaran/newsletter kapan saja.</li>
                                </ul>
                                <p className="pt-4">
                                    Untuk mengajukan permintaan ini, silakan hubungi tim administrasi kami melalui email resmi Bumi Anyom yang tertera di halaman kontak.
                                </p>
                            </div>
                        </div>

                    </div>
                </section>

                <FooterSection />
            </main>
        </PageLayout>
    );
}
