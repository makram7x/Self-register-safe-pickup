import React from "react";

const FileUploadErrorModal = ({ isOpen, onClose, errors }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed z-50 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen">
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        <div className="relative bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full mx-4 overflow-hidden shadow-xl">
          <div className="px-6 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-red-600 dark:text-red-400">
                File Upload Error
              </h3>
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ×
              </button>
            </div>

            <div className="mt-4">
              <h3 className="font-medium mb-2 dark:text-gray-200">
                File Format Requirements:
              </h3>
              <ul className="list-disc pl-5 mb-4 space-y-1 dark:text-gray-300">
                <li>Accepted file types: .xlsx or .csv</li>
                <li>First row should contain headers</li>
                <li>
                  Required columns in order:
                  <ul className="list-disc pl-5 mt-1">
                    <li>Student Name</li>
                    <li>Parent Name</li>
                    <li>Grade (1-6)</li>
                    <li>Parent Phone</li>
                    <li>Parent Email</li>
                  </ul>
                </li>
              </ul>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-md mb-4">
                <h4 className="font-medium mb-2 dark:text-gray-200">
                  Example Format:
                </h4>
                <code className="text-sm block whitespace-pre-wrap dark:text-gray-300">
                  Student Name,Parent Name,Grade,Parent Phone,Parent Email John
                  Doe,Jane Doe,3,123-456-7890,jane@example.com
                </code>
              </div>

              {errors && errors.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                  <h3 className="font-medium text-red-600 dark:text-red-400 mb-2">
                    Errors Found:
                  </h3>
                  <ul className="list-disc pl-5 space-y-1">
                    {errors.map((error, index) => (
                      <li
                        key={index}
                        className="text-sm text-red-600 dark:text-red-400"
                      >
                        {error.studentName ? `${error.studentName}: ` : ""}
                        {error.error || error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadErrorModal;
