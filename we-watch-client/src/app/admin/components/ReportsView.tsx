import React, { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { getViolationReports } from '@/src/services/admin';
import { ShieldAlert, User, Calendar, MessageSquare, Monitor } from 'lucide-react';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const ReportsView: React.FC = () => {
  const [page, setPage] = useState(1);
  const limit = 10;

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', page],
    queryFn: () => getViolationReports(page, limit),
    placeholderData: keepPreviousData,
  });

  const reports = data?.reports || [];
  const totalPages = data?.totalPages || 1;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-2xl font-black text-white">Báo cáo vi phạm</h4>
        <p className="text-sm font-medium text-gray-400">
          Danh sách các phòng bị dừng do vi phạm bản quyền hoặc nội dung
        </p>
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/5 bg-[#111113] shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-white/5 bg-white/5">
              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-gray-400 uppercase">Phòng</th>
              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-gray-400 uppercase">Người Host</th>
              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-gray-400 uppercase">Lý do</th>
              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-gray-400 uppercase">Admin xử lý</th>
              <th className="px-6 py-4 text-[10px] font-black tracking-widest text-gray-400 uppercase">Thời gian</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {reports.map((report: any) => (
              <tr key={report.id} className="transition-colors hover:bg-white/[0.02]">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                      <Monitor size={16} />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{report.roomTitle}</div>
                      <div className="text-[10px] font-medium text-gray-500">{report.roomId}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <User size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-white">@{report.hostName}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare size={14} className="text-primary" />
                    <span className="text-sm font-medium text-gray-300">{report.reason}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert size={14} className="text-orange-400" />
                    <span className="text-sm font-bold text-orange-400">{report.adminName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar size={14} />
                    {format(new Date(report.createdAt), 'dd/MM/yyyy HH:mm', { locale: vi })}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {reports.length === 0 && (
          <div className="py-20 text-center font-bold tracking-widest text-gray-400 uppercase">
            Chưa có báo cáo vi phạm nào
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-white/10 bg-transparent px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/5 disabled:opacity-40"
          >
            Trước
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                  page === p ? 'bg-primary text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-white/10 bg-transparent px-4 py-2 text-xs font-bold text-white transition-all hover:bg-white/5 disabled:opacity-40"
          >
            Sau
          </button>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
