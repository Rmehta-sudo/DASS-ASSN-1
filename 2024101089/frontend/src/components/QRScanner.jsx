import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

const QRScanner = ({ onScan, onError }) => {
    const scannerRef = useRef(null);
    const [scanResult, setScanResult] = useState(null);

    useEffect(() => {
        // Prevent double rendering in strict mode
        if (scannerRef.current) return;

        // Create instance
        const scanner = new Html5QrcodeScanner(
            "reader",
            { fps: 10, qrbox: { width: 250, height: 250 } },
            /* verbose= */ false
        );
        scannerRef.current = scanner;

        scanner.render(
            (decodedText) => {
                // Success callback
                if (decodedText !== scanResult) {
                    // Debounce or just trigger?
                    // Trigger only if different or just trigger logic?
                    // Let parent handle duplicate checks usually, but here we can just update state
                    setScanResult(decodedText);
                    if (onScan) onScan(decodedText);

                    // Clear after scan? Or keep scanning?
                    // Typically keep scanning for attendance
                }
            },
            (error) => {
                // Error callback
                if (onError) onError(error);
            }
        );

        // Cleanup
        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(error => {
                    console.error("Failed to clear html5-qrcode scanner. ", error);
                });
                scannerRef.current = null;
            }
        };
    }, []); // Empty dependency array

    return (
        <div className="flex flex-col items-center justify-center w-full">
            <div id="reader" className="w-full max-w-sm border-2 border-slate-200 rounded-lg overflow-hidden"></div>
            {scanResult && <p className="mt-2 text-green-600 font-bold text-sm">Last Scanned: {scanResult}</p>}
        </div>
    );
};

export default QRScanner;
