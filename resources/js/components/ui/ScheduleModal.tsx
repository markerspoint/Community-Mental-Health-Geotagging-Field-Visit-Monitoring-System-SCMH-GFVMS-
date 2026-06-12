import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { capitalizeWords } from '../../lib/utils';

interface ScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (date: string, staffName: string) => void;
    patientName: string;
    assignedStaffName: string | null;
}

export function ScheduleModal({
    isOpen,
    onClose,
    onConfirm,
    patientName,
    assignedStaffName
}: ScheduleModalProps) {
    const { auth } = usePage().props as any;
    
    // Default to tomorrow
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const [date, setDate] = useState(tomorrowStr);
    const [staffName, setStaffName] = useState('');

    // Update state when modal opens or patient changes
    useEffect(() => {
        if (isOpen) {
            setDate(tomorrowStr);
            setStaffName(assignedStaffName || auth?.user?.name || 'BHW Staff');
        }
    }, [isOpen, assignedStaffName, auth]);

    // Escape key listener to close modal
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!date || !staffName.trim()) return;
        onConfirm(date, staffName.trim());
        onClose();
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div 
                className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-2xl p-6 transform animate-scale-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition"
                    aria-label="Close modal"
                >
                    <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header with Icon */}
                <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center justify-center h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400">
                        <svg className="h-5.5 w-5.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-white">Schedule Field Visit</h3>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500">Configure scheduling parameters for this outreach.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <span className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Patient</span>
                        <p className="text-xs font-bold text-slate-800 dark:text-white bg-slate-50 dark:bg-slate-800/50 px-3 py-2 rounded-xl border border-slate-100 dark:border-slate-800">
                            {capitalizeWords(patientName)}
                        </p>
                    </div>

                    <div>
                        <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Visit Date</label>
                        <input
                            type="date"
                            required
                            min={new Date().toISOString().split('T')[0]}
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500 text-slate-850 dark:text-slate-200"
                        />
                    </div>

                    <div>
                        <label className="block text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Assigned BHW/Staff</label>
                        <input
                            type="text"
                            required
                            placeholder="Enter staff name"
                            value={staffName}
                            onChange={(e) => setStaffName(e.target.value)}
                            className="w-full text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2.5 outline-none focus:ring-1 focus:ring-teal-500 text-slate-850 dark:text-slate-200"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/80 transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-2xl hover:shadow-lg hover:shadow-teal-600/20 transition cursor-pointer"
                        >
                            Confirm Schedule
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
