import React from 'react';
import Image from 'next/image';
import { Shield, ShieldCheck, Ban, UserX } from 'lucide-react';
import { User } from '@/src/services/user';

interface UsersViewProps {
  users: User[];
  onBanUser: (id: string, isBanned: boolean) => void;
  onSwitchRole: (id: string) => void;
}

const UsersView: React.FC<UsersViewProps> = ({ users, onBanUser, onSwitchRole }) => {
  return (
    <div className="overflow-hidden rounded-3xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-50 p-8">
        <div>
          <h4 className="text-2xl font-black text-gray-900">Quản lý người dùng</h4>
          <p className="text-sm font-medium text-gray-400">Tổng số {users.length} thành viên trong cộng đồng</p>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-gray-50 text-[11px] font-black tracking-widest text-gray-400 uppercase">
              <th className="px-8 py-5">Thông tin người dùng</th>
              <th className="px-8 py-5">Vai trò hệ thống</th>
              <th className="px-8 py-5 text-center">Trạng thái</th>
              <th className="px-8 py-5 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className="group transition-colors hover:bg-gray-50/50">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-5">
                    <div className="h-16 w-16 overflow-hidden rounded-2xl border-2 border-gray-100 group-hover:border-red-100 transition-colors relative shadow-sm">
                      <Image 
                        src={u.avatarUrl || 'https://i.pravatar.cc/150'} 
                        alt={u.username} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                    <div>
                      <p className="text-lg font-black text-gray-900">{u.username}</p>
                      <p className="text-sm font-medium text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-black tracking-tighter uppercase ${
                      u.role === 'admin'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-gray-50 text-gray-500'
                    }`}
                  >
                    <Shield size={14} /> {u.role === 'admin' ? 'Quản trị' : 'Người dùng'}
                  </span>
                </td>
                <td className="px-8 py-6 text-center">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                      u.isBanned ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
                    }`}
                  >
                    {u.isBanned ? 'Đã khóa' : 'Hoạt động'}
                  </span>
                </td>
                <td className="px-8 py-6 text-right">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => onBanUser(u.id, !u.isBanned)}
                      title={u.isBanned ? 'Mở khóa' : 'Khóa tài khoản'}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl border border-gray-100 transition-all ${
                        u.isBanned
                          ? 'bg-green-50 text-green-600 hover:border-green-200'
                          : 'bg-white text-gray-400 hover:border-red-100 hover:text-red-600'
                      }`}
                    >
                      {u.isBanned ? <ShieldCheck size={20} /> : <Ban size={20} />}
                    </button>
                    <button
                      onClick={() => onSwitchRole(u.id)}
                      title="Đổi vai trò Admin/User"
                      className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-100 bg-white text-gray-400 transition-all hover:border-blue-100 hover:text-blue-600"
                    >
                      <Shield size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersView;
