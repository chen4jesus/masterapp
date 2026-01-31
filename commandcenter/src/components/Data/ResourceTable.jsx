import React from 'react';
import { MoreHorizontal, Edit, Trash2 } from 'lucide-react';

const ResourceTable = ({ columns, data, onEdit, onDelete }) => {
  return (
    <div className="glass-panel overflow-hidden rounded-xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5">
              {columns.map((col) => (
                <th 
                  key={col.key} 
                  className="px-6 py-4 text-xs font-semibold text-slate-400 uppercase tracking-wider"
                  style={{ width: col.width }}
                >
                  {col.label}
                </th>
              ))}
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((item, index) => (
              <tr key={item.id || index} className="group hover:bg-white/[0.02] border-b border-white/5 last:border-0 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-6 py-4 text-sm text-slate-300">
                    {col.render ? col.render(item) : item[col.key]}
                  </td>
                ))}
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                        onClick={() => onEdit && onEdit(item)}
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors"
                    >
                        Edit
                    </button>
                    <button 
                        onClick={() => onDelete && onDelete(item)}
                        className="p-1.5 rounded-full hover:bg-red-500/10 hover:text-red-400 text-slate-500 transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.length === 0 && (
        <div className="p-8 text-center text-slate-500 text-sm">
            No resources found.
        </div>
      )}
    </div>
  );
};

export default ResourceTable;
