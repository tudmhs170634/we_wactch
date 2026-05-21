import React, { useState } from 'react';
import Image from 'next/image';
import { Shield, ShieldCheck, Ban } from 'lucide-react';
import { keepPreviousData, useQuery, useQueryClient } from '@tanstack/react-query';
import { useDebounce } from '@/src/hooks/useDebounce';
import { getAllUsers } from '@/src/services/user';
import SearchBar from '@/src/components/SearchBar';

// Không cần truyền users từ ngoài vào nữa vì ta sẽ tự gọi API ở trong
interface UsersViewProps {
  globalSearchTerm: string;
  onBanUser: (id: string, isBanned: boolean) => Promise<void> | void;
  onSwitchRole: (id: string) => Promise<void> | void;
}

const UsersView: React.FC<UsersViewProps> = ({
  globalSearchTerm,
  onBanUser,
  onSwitchRole,
}) => {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);

  // Trì hoãn search 500ms
  const debouncedSearch = useDebounce(globalSearchTerm, 500);
  const cleanSearchTerm = debouncedSearch.trim(); // Loại bỏ phím space ở đầu/cuối

  // Khi globalSearchTerm thay đổi thì reset về trang 1
  React.useEffect(() => {
    setPage(1);
  }, [globalSearchTerm]);

  // Fetch API với React Query
  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', page, 10, cleanSearchTerm],
    queryFn: () => getAllUsers(page, 10, cleanSearchTerm || undefined),
    placeholderData: keepPreviousData,
  });

  // Bọc hàm thao tác lại để sau khi làm xong thì tự động load lại danh sách
  const handleBan = async (id: string, isBanned: boolean) => {
    await onBanUser(id, isBanned);
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  const handleSwitchRole = async (id: string) => {
    await onSwitchRole(id);
    queryClient.invalidateQueries({ queryKey: ['admin-users'] });
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#111113] shadow-sm">
      {/* HEADER */}
      <div className="flex items-center justify-between border-b border-white/5 p-8">
        <div>
          <h4 className="text-2xl font-black text-white">Quản lý người dùng</h4>
          <p className="text-sm font-medium text-gray-400">
            Tổng số {data?.total || 0} thành viên trong cộng đồng
          </p>
        </div>
      </div>

      {/* TABLE DATA */}
      {isLoading ? (
        <div className="flex justify-center p-10">
          <p className="text-gray-400">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-white/5 text-[11px] font-black tracking-widest text-gray-400 uppercase">
                  <th className="px-8 py-5">Thông tin người dùng</th>
                  <th className="px-8 py-5">Vai trò hệ thống</th>
                  <th className="px-8 py-5 text-center">Trạng thái</th>
                  <th className="px-8 py-5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data?.users?.map((u: any) => (
                  <tr
                    key={u.id}
                    className="group hover:bg-white/5/50 transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div className="group-hover:border-primary/20 relative h-16 w-16 overflow-hidden rounded-2xl border-2 border-white/10 shadow-sm transition-colors">
                          <Image
                            src={u.avatarUrl || 'https://i.pravatar.cc/150'}
                            alt={u.username}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="text-lg font-black text-white">
                            {u.username}
                          </p>
                          <p className="text-sm font-medium text-gray-400">
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-black tracking-tighter uppercase ${
                          u.role === 'admin'
                            ? 'bg-[#FF0000]/20 text-[#FF0000]'
                            : 'bg-white/5 text-gray-400'
                        }`}
                      >
                        <Shield size={14} />{' '}
                        {u.role === 'admin' ? 'Quản trị' : 'Người dùng'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-black uppercase ${
                          u.isBanned
                            ? 'bg-[#FF0000]/20 text-[#FF0000]'
                            : 'bg-green-500/10 text-green-500'
                        }`}
                      >
                        {u.isBanned ? 'Đã khóa' : 'Hoạt động'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => handleBan(u.id, !u.isBanned)}
                          title={u.isBanned ? 'Mở khóa' : 'Khóa tài khoản'}
                          className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 transition-all ${
                            u.isBanned
                              ? 'bg-green-500/10 text-green-500 hover:border-green-500/50'
                              : 'border border-white/5 bg-[#111113] text-gray-400 hover:border-[#FF0000]/50 hover:text-[#FF0000]'
                          }`}
                        >
                          {u.isBanned ? (
                            <ShieldCheck size={20} />
                          ) : (
                            <Ban size={20} />
                          )}
                        </button>
                        <button
                          onClick={() => handleSwitchRole(u.id)}
                          title="Đổi vai trò Admin/User"
                          className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/5 border-white/10 bg-[#111113] text-gray-400 transition-all hover:border-blue-500/50 hover:text-blue-500"
                        >
                          <Shield size={20} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Empty State */}
            {(!data?.users || data.users.length === 0) && (
              <p className="py-10 text-center text-gray-400">
                Không tìm thấy kết quả nào.
              </p>
            )}
          </div>

          {/* PAGINATION */}
          {data?.totalPages > 1 && (
            <div className="flex items-center justify-center border-t border-white/5 p-6">
              <div className="flex items-center gap-1.5">
                {/* Nút Back */}
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="flex h-8 items-center justify-center gap-1 rounded-md border border-white/10 bg-transparent px-3 text-xs font-medium text-white transition-colors hover:bg-white/5 disabled:pointer-events-none disabled:opacity-40"
                >
                  <span className="text-gray-500">&lt;</span> Back
                </button>

                {/* Các số trang */}
                {(() => {
                  const total = data.totalPages;
                  let pages = [];

                  // Thuật toán hiển thị tối đa 5 trang xung quanh trang hiện tại
                  if (total <= 5) {
                    pages = Array.from({ length: total }, (_, i) => i + 1);
                  } else if (page <= 3) {
                    pages = [1, 2, 3, 4, 5];
                  } else if (page >= total - 2) {
                    pages = [total - 4, total - 3, total - 2, total - 1, total];
                  } else {
                    pages = [page - 2, page - 1, page, page + 1, page + 2];
                  }

                  return pages.map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`flex h-8 min-w-[32px] items-center justify-center rounded-md border text-xs font-bold transition-colors ${
                        page === p
                          ? 'border-white bg-white text-black shadow-sm'
                          : 'border-white/10 bg-transparent text-gray-400 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      {p}
                    </button>
                  ));
                })()}

                {/* Nút Next */}
                <button
                  disabled={page === data.totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(data.totalPages, p + 1))
                  }
                  className="flex h-8 items-center justify-center gap-1 rounded-md border border-white/10 bg-transparent px-3 text-xs font-medium text-white transition-colors hover:bg-white/5 disabled:pointer-events-none disabled:opacity-40"
                >
                  Next <span className="text-gray-500">&gt;</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UsersView;
