"""
Thermal Printer ESC/POS Direct IP Audit & Test Script
Usage:
  1. Scan subnet for thermal printers:
     python test_printer.py --scan

  2. Test a specific printer IP:
     python test_printer.py 192.168.1.200

  3. Test with custom port (default 9100):
     python test_printer.py 192.168.1.200 9100
"""

import socket
import sys
import time
from concurrent.futures import ThreadPoolExecutor

# ESC/POS Command Byte Constants
ESC = b'\x1b'
GS = b'\x1d'

CMD_INIT = ESC + b'@'
CMD_ALIGN_LEFT = ESC + b'a\x00'
CMD_ALIGN_CENTER = ESC + b'a\x01'
CMD_ALIGN_RIGHT = ESC + b'a\x02'
CMD_BOLD_ON = ESC + b'E\x01'
CMD_BOLD_OFF = ESC + b'E\x00'
CMD_DOUBLE_ON = GS + b'!\x11'
CMD_DOUBLE_OFF = GS + b'!\x00'
CMD_FEED_AND_CUT = GS + b'V\x41\x03'
CMD_KICK_DRAWER = ESC + b'p\x00\x19\xfa'

def format_two_cols(left: str, right: str, width: int = 48) -> str:
    max_left = width - len(right) - 1
    truncated_left = left[:max_left] if len(left) > max_left else left
    spaces = max(1, width - len(truncated_left) - len(right))
    return truncated_left + (' ' * spaces) + right + '\n'

def build_test_receipt(paper_size: str = '80mm') -> bytes:
    width = 32 if paper_size == '58mm' else 48
    divider = ('-' * width) + '\n'
    double_divider = ('=' * width) + '\n'
    
    buf = bytearray()
    buf.extend(CMD_INIT)
    
    # Store Header
    buf.extend(CMD_ALIGN_CENTER)
    buf.extend(CMD_BOLD_ON)
    buf.extend(CMD_DOUBLE_ON)
    buf.extend("JAMBU KLUTUK RESORT\n".encode('latin1'))
    buf.extend(CMD_DOUBLE_OFF)
    buf.extend(CMD_BOLD_OFF)
    buf.extend("Jl. Raya Parakan Wonosobo Km. 3, Temanggung\n".encode('latin1'))
    buf.extend("Telp: +62 8112715562\n\n".encode('latin1'))
    
    # Title
    buf.extend(CMD_BOLD_ON)
    buf.extend("*** TEST PRINT DIRECT IP (ESC/POS) ***\n".encode('latin1'))
    buf.extend(CMD_BOLD_OFF)
    buf.extend(double_divider.encode('latin1'))
    
    # Metadata
    buf.extend(CMD_ALIGN_LEFT)
    buf.extend(format_two_cols("No. Trx : TEST-DIRECT-IP-001", "", width).encode('latin1'))
    buf.extend(format_two_cols(f"Tanggal : {time.strftime('%d/%m/%Y, %H:%M')}", "", width).encode('latin1'))
    buf.extend(format_two_cols("Kasir   : ALFIYA", "Meja: PERAHU", width).encode('latin1'))
    buf.extend(format_two_cols("Pelanggan: Karsimin", "Metode: TUNAI", width).encode('latin1'))
    buf.extend(divider.encode('latin1'))
    
    # Sample items
    buf.extend(CMD_BOLD_ON)
    buf.extend(format_two_cols("MENU / ITEM", "TOTAL", width).encode('latin1'))
    buf.extend(CMD_BOLD_OFF)
    buf.extend(divider.encode('latin1'))
    
    items = [
        ("AMERICANO", "Rp 18.000"),
        ("CARAMEL MACHIATO", "Rp 22.000"),
        ("3X KOPI TUBRUK ROBUSTA", "Rp 45.000"),
        ("8X ORIGINAL TEA", "Rp 64.000"),
        ("2X AYAM BAKAR", "Rp 65.000"),
        ("3X AYAM GORENG KREMES", "Rp 97.500"),
        ("5X BEBEK GORENG KREMES", "Rp 175.000"),
        ("4X NASI GORENG JAWA", "Rp 100.000"),
        ("6X MENDOAN", "Rp 90.000"),
        ("2X SOUP AYAM", "Rp 49.000")
    ]
    
    for name, price in items:
        buf.extend(format_two_cols(name, price, width).encode('latin1'))
    
    buf.extend(divider.encode('latin1'))
    buf.extend(format_two_cols("Subtotal", "Rp 725.500", width).encode('latin1'))
    buf.extend(format_two_cols("Pajak Resto (PB1) (10%)", "+Rp 72.550", width).encode('latin1'))
    buf.extend(double_divider.encode('latin1'))
    
    buf.extend(CMD_BOLD_ON)
    buf.extend(CMD_DOUBLE_ON)
    buf.extend(format_two_cols("TOTAL", "Rp 798.050", width).encode('latin1'))
    buf.extend(CMD_DOUBLE_OFF)
    buf.extend(CMD_BOLD_OFF)
    buf.extend(double_divider.encode('latin1'))
    
    # Footer
    buf.extend(CMD_ALIGN_CENTER)
    buf.extend("Terima kasih atas kunjungan Anda\n".encode('latin1'))
    buf.extend("Struk ini adalah bukti pembayaran yang sah\n\n".encode('latin1'))
    
    buf.extend(CMD_BOLD_ON)
    buf.extend("powered by\n".encode('latin1'))
    buf.extend("MY TARA\n".encode('latin1'))
    buf.extend(CMD_BOLD_OFF)
    
    # Feed and cut right under the logo
    buf.extend(b"\n\n\n")
    buf.extend(CMD_FEED_AND_CUT)
    
    return bytes(buf)

def test_printer_connection(ip: str, port: int = 9100, timeout: float = 3.0) -> tuple[bool, str]:
    start = time.time()
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            s.connect((ip, port))
            latency = int((time.time() - start) * 1000)
            return True, f"Koneksi SUKSES ({latency}ms)"
    except socket.timeout:
        return False, "Timeout (3s) - Printer tidak merespons"
    except ConnectionRefusedError:
        return False, "Koneksi ditolak (Port 9100 tidak aktif / tertutup)"
    except Exception as e:
        return False, f"Error: {e}"

def send_test_print(ip: str, port: int = 9100, paper_size: str = '80mm') -> bool:
    print(f"\n[+] Menghubungkan ke Thermal Printer di {ip}:{port}...")
    success, msg = test_printer_connection(ip, port)
    if not success:
        print(f"[-] Gagal: {msg}")
        return False
    
    print(f"[+] Status: {msg}")
    print("[+] Membuat ESC/POS binary data...")
    receipt_bytes = build_test_receipt(paper_size)
    
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(4.0)
            s.connect((ip, port))
            s.sendall(receipt_bytes)
            print(f"[+] SUKSES! Struk uji coba ({len(receipt_bytes)} bytes) berhasil dikirim ke {ip}:{port}.")
            print("[+] Printer akan mencetak struk dan auto-cut di bawah 'powered by MY TARA'.\n")
            return True
    except Exception as e:
        print(f"[-] Gagal mengirim data ke printer: {e}")
        return False

def check_ip_worker(ip: str, port: int) -> tuple[str, bool, str]:
    success, msg = test_printer_connection(ip, port, timeout=0.8)
    return ip, success, msg

def scan_subnet(subnet_prefix: str = "192.168.1.", port: int = 9100):
    print(f"\n[*] Memindai subnet {subnet_prefix}1-254 pada port {port} (ESC/POS)...")
    found = []
    
    ips = [f"{subnet_prefix}{i}" for i in range(1, 255)]
    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = [executor.submit(check_ip_worker, ip, port) for ip in ips]
        for f in futures:
            ip, success, msg = f.result()
            if success:
                found.append((ip, msg))
                print(f"  --> DITEMUKAN PRINTER di {ip}:{port} ({msg})")
    
    if not found:
        print("[-] Tidak ada printer thermal yang merespons pada subnet ini.")
        print("    Tips: Pastikan printer thermal menyala, kabel LAN terpasang, dan IP berada di segmen jaringan yang sama.")
    else:
        print(f"\n[+] Total {len(found)} printer ditemukan:")
        for ip, msg in found:
            print(f"    - {ip}:{port}")
    return found

if __name__ == "__main__":
    args = sys.argv[1:]
    
    if not args:
        print("=" * 60)
        print(" THERMAL PRINTER ESC/POS DIRECT IP AUDIT")
        print("=" * 60)
        print("Pilihan:")
        print("  1. python test_printer.py --scan          (Scan otomatis)")
        print("  2. python test_printer.py <IP_PRINTER>   (Kirim test print ke IP)")
        print("Contoh: python test_printer.py 192.168.1.200")
        print("=" * 60)
        
        # Interactive prompt
        choice = input("\nMasukkan IP Printer atau ketik 'scan': ").strip()
        if choice.lower() == 'scan' or choice == '':
            scan_subnet()
        else:
            send_test_print(choice)
    elif args[0] == '--scan':
        scan_subnet()
    else:
        target_ip = args[0]
        target_port = int(args[1]) if len(args) > 1 else 9100
        send_test_print(target_ip, target_port)
