'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Building,
  Users,
  ShoppingBag,
  Plus,
  LogOut,
  ShieldAlert,
  Loader2,
  MapPin,
  UserPlus,
  Layers,
} from 'lucide-react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

interface RestoCount {
  User: number;
  ProductStock: number;
  Transaction: number;
}

interface Resto {
  id: string;
  name: string;
  address: string;
  createdAt: string;
  _count: RestoCount;
}

export default function SuperadminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);
  const [restos, setRestos] = useState<Resto[]>([]);
  
  // Form states
  const [restoName, setRestoName] = useState('');
  const [restoAddress, setRestoAddress] = useState('');
  const [restoLoading, setRestoLoading] = useState(false);

  const [userName, setUserName] = useState('');
  const [userUsername, setUserUsername] = useState('');
  const [userPassword, setUserPassword] = useState('');
  const [userRole, setUserRole] = useState('OWNER');
  const [userRestoId, setUserRestoId] = useState('');
  const [userLoading, setUserLoading] = useState(false);

  useEffect(() => {
    // 1. Route guard
    const userJson = localStorage.getItem('user');
    if (!userJson) {
      window.location.href = 'http://localhost:3000';
      return;
    }

    const user = JSON.parse(userJson);
    if (user.role !== 'SUPERADMIN') {
      toast.error('Akses ditolak. Halaman ini khusus Superadmin Korporat.');
      router.push('/home');
      return;
    }

    setAdminUser(user);
    fetchData();
  }, [router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/superadmin/restos');
      setRestos(response.data);
      if (response.data.length > 0 && !userRestoId) {
        setUserRestoId(response.data[0].id);
      }
    } catch (err: any) {
      toast.error('Gagal mengambil data resto.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateResto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoName) {
      toast.warning('Nama resto wajib diisi');
      return;
    }

    setRestoLoading(true);
    try {
      const response = await axios.post('/api/superadmin/restos', {
        name: restoName,
        address: restoAddress,
      });

      if (response.data.success) {
        toast.success(`Resto "${restoName}" berhasil didaftarkan!`);
        setRestoName('');
        setRestoAddress('');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal membuat resto.');
    } finally {
      setRestoLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName || !userUsername || !userPassword || !userRestoId) {
      toast.warning('Harap lengkapi semua kolom input user.');
      return;
    }

    setUserLoading(true);
    try {
      const response = await axios.post('/api/superadmin/users', {
        name: userName,
        username: userUsername,
        password: userPassword,
        role: userRole,
        restoId: userRestoId,
      });

      if (response.data.success) {
        toast.success(`Akun "${userUsername}" berhasil dibuat!`);
        setUserName('');
        setUserUsername('');
        setUserPassword('');
        fetchData();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Gagal mendaftarkan user baru.');
    } finally {
      setUserLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    toast.success('Berhasil keluar!');
    window.location.href = 'http://localhost:3000/select-module';
  };

  if (loading && !adminUser) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-slate-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-slate-400 text-sm">Memuat Dashboard Korporat...</p>
      </div>
    );
  }

  // Calculate metrics
  const totalRestos = restos.length;
  const totalUsers = restos.reduce((acc, curr) => acc + curr._count.User, 0);
  const totalProducts = restos.reduce((acc, curr) => acc + curr._count.ProductStock, 0);
  const totalTransactions = restos.reduce((acc, curr) => acc + curr._count.Transaction, 0);

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 p-6 md:p-10 relative overflow-hidden">
      <ToastContainer position="top-right" autoClose={3000} theme="dark" />
      
      {/* Backdrops */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 rounded-full bg-emerald-600/10 blur-[120px] pointer-events-none" />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-6 mb-8 gap-4 z-10 relative">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-emerald-400 bg-clip-text text-transparent">
            Nexura POS Superadmin
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Portal Administrasi Korporat & Manajemen Tenant SaaS Multi-Resto
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-300">
              Admin: {adminUser?.name}
            </span>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="border-red-900/50 hover:bg-red-950/20 text-red-400 hover:text-red-300 flex items-center gap-2 bg-slate-950 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </Button>
        </div>
      </header>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8 z-10 relative">
        <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Cafe/Resto
            </CardTitle>
            <Building className="w-4 h-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalRestos}</div>
            <p className="text-[10px] text-slate-500 mt-1">Outlet terdaftar di sistem</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Pengguna
            </CardTitle>
            <Users className="w-4 h-4 text-violet-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalUsers}</div>
            <p className="text-[10px] text-slate-500 mt-1">Owner & kasir tenant</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Produk
            </CardTitle>
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalProducts}</div>
            <p className="text-[10px] text-slate-500 mt-1">Stok produk yang dimanage</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Total Transaksi
            </CardTitle>
            <Layers className="w-4 h-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalTransactions}</div>
            <p className="text-[10px] text-slate-500 mt-1">Transaksi tersimpan di cloud</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 z-10 relative">
        {/* Left column - Forms */}
        <div className="space-y-6 lg:col-span-1">
          {/* Resto Creation */}
          <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-400" />
                Registrasi Outlet Baru
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Tambahkan cafe atau resto tenant baru ke dalam server POS.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateResto} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="resto_name" className="text-xs text-slate-300">Nama Resto / Cafe</Label>
                  <Input
                    id="resto_name"
                    placeholder="Contoh: Bumi Coffee Space"
                    value={restoName}
                    onChange={(e) => setRestoName(e.target.value)}
                    className="bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="resto_addr" className="text-xs text-slate-300">Alamat Outlet</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-2.5 h-4 w-4 text-slate-600" />
                    <Input
                      id="resto_addr"
                      placeholder="Contoh: Jl. Diponegoro No. 8"
                      value={restoAddress}
                      onChange={(e) => setRestoAddress(e.target.value)}
                      className="pl-10 bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <Button
                  type="submit"
                  disabled={restoLoading}
                  className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs py-2 transition-colors flex items-center justify-center gap-2"
                >
                  {restoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Daftarkan Cafe/Resto
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* User Assignment Creation */}
          <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md shadow-xl">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                Buat Akun Tenant
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Daftarkan akun kasir (Worker) atau Owner untuk outlet tenant.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="user_resto" className="text-xs text-slate-300">Hubungkan ke Outlet</Label>
                  <select
                    id="user_resto"
                    value={userRestoId}
                    onChange={(e) => setUserRestoId(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-800 bg-slate-950/80 text-xs px-3 text-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    {restos.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                    {restos.length === 0 && (
                      <option value="">Belum ada outlet terdaftar</option>
                    )}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_name" className="text-xs text-slate-300">Nama Lengkap</Label>
                  <Input
                    id="user_name"
                    placeholder="Contoh: Budi Santoso"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_uname" className="text-xs text-slate-300">Username Akun</Label>
                  <Input
                    id="user_uname"
                    placeholder="Contoh: budicafe"
                    value={userUsername}
                    onChange={(e) => setUserUsername(e.target.value)}
                    className="bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_pass" className="text-xs text-slate-300">Password</Label>
                  <Input
                    id="user_pass"
                    type="password"
                    placeholder="Masukkan password akun"
                    value={userPassword}
                    onChange={(e) => setUserPassword(e.target.value)}
                    className="bg-slate-950/50 border-slate-800 text-slate-200 placeholder:text-slate-600 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user_role" className="text-xs text-slate-300">Hak Akses (Role)</Label>
                  <select
                    id="user_role"
                    value={userRole}
                    onChange={(e) => setUserRole(e.target.value)}
                    className="w-full h-9 rounded-md border border-slate-800 bg-slate-950/80 text-xs px-3 text-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="OWNER">OWNER (Pemilik Resto)</option>
                    <option value="WORKER">WORKER (Kasir Resto)</option>
                  </select>
                </div>

                <Button
                  type="submit"
                  disabled={userLoading}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2 transition-colors flex items-center justify-center gap-2"
                >
                  {userLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Daftarkan Akun User
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Right column - List table */}
        <div className="lg:col-span-2">
          <Card className="bg-slate-900/40 border-slate-800/80 backdrop-blur-md shadow-xl h-full flex flex-col">
            <CardHeader>
              <CardTitle className="text-lg font-bold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-400" />
                Daftar Outlet & Aktivitas Tenant
              </CardTitle>
              <CardDescription className="text-slate-400 text-xs">
                Memonitor semua resto terdaftar beserta jumlah user, inventaris produk, dan total transaksi checkout.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto">
              <div className="relative overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/40">
                <table className="w-full text-sm text-left text-slate-300">
                  <thead className="text-xs uppercase bg-slate-900/60 border-b border-slate-800 text-slate-400 font-bold">
                    <tr>
                      <th scope="col" className="px-6 py-3">Nama Outlet</th>
                      <th scope="col" className="px-6 py-3">Alamat</th>
                      <th scope="col" className="px-6 py-3 text-center">User</th>
                      <th scope="col" className="px-6 py-3 text-center">Produk</th>
                      <th scope="col" className="px-6 py-3 text-center">Transaksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restos.map((r) => (
                      <tr key={r.id} className="border-b border-slate-800/60 hover:bg-slate-900/30 transition-colors">
                        <td className="px-6 py-4 font-semibold text-white">
                          {r.name}
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400 max-w-[150px] truncate">
                          {r.address || '-'}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-bold text-violet-400">
                          {r._count.User}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-bold text-emerald-400">
                          {r._count.ProductStock}
                        </td>
                        <td className="px-6 py-4 text-center text-xs font-bold text-amber-400">
                          {r._count.Transaction}
                        </td>
                      </tr>
                    ))}
                    {restos.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-8 text-center text-slate-500 text-xs">
                          Belum ada cafe atau resto terdaftar di sistem.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
