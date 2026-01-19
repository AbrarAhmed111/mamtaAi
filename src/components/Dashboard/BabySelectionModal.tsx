'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaBaby, FaTimes } from 'react-icons/fa';

interface Baby {
  id: string;
  name: string;
  age: string;
  avatar: string;
}

interface BabySelectionModalProps {
  isOpen: boolean;
  babies: Baby[];
  selectedBabyId: string | null;
  onSelectBaby: (babyId: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  onAddBaby: () => void;
  isLoading?: boolean;
}

export default function BabySelectionModal({
  isOpen,
  babies,
  selectedBabyId,
  onSelectBaby,
  onConfirm,
  onCancel,
  onAddBaby,
  isLoading = false
}: BabySelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-rose-100 rounded-full flex items-center justify-center">
              <FaBaby className="text-pink-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Select Baby</h3>
              <p className="text-sm text-gray-500">Choose which baby this recording is for</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close modal"
          >
            <FaTimes className="text-gray-400 hover:text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
              <p className="mt-4 text-gray-600">Loading babies...</p>
            </div>
          ) : babies.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBaby className="text-gray-400 text-3xl" />
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">No babies found</h4>
              <p className="text-gray-600 mb-6">
                Please add a baby profile before recording a cry.
              </p>
              <Link
                href="/dashboard/babies/add-baby"
                onClick={() => {
                  onCancel();
                  onAddBaby();
                }}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white font-semibold hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <FaBaby />
                Add Baby
              </Link>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {babies.map((baby) => {
                const isSelected = selectedBabyId === baby.id;
                return (
                  <button
                    key={baby.id}
                    onClick={() => onSelectBaby(baby.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-pink-500 bg-pink-50 shadow-md'
                        : 'border-gray-200 hover:border-pink-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="relative w-14 h-14 rounded-full overflow-hidden flex-shrink-0 border-2 border-white shadow-sm">
                      <Image
                        src={baby.avatar || '/api/placeholder/64/64'}
                        alt={baby.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <h4 className="font-semibold text-gray-900 truncate">{baby.name}</h4>
                      <p className="text-sm text-gray-500">{baby.age}</p>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'border-pink-500 bg-pink-500'
                          : 'border-gray-300'
                      }`}
                    >
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {babies.length > 0 && (
          <div className="flex items-center justify-between gap-3 p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
            <button
              onClick={onCancel}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={!selectedBabyId}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl hover:from-pink-600 hover:to-rose-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              Start Recording
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
