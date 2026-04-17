"use client"
import { useState } from 'react'
import Image from 'next/image'

interface RoomGalleryProps {
    images: { image_url: string }[];
}

export default function RoomGallery({ images }: RoomGalleryProps) {
    const [selectedImg, setSelectedImg] = useState<string | null>(null);

    return (
        <>
            <div className="grid grid-cols-4 gap-4">
                {images.slice(0, 4).map((img, index) => (
                    <div
                        key={index}
                        onClick={() => setSelectedImg(img.image_url)}
                        className="relative aspect-square rounded-[1.5rem] overflow-hidden border-4 border-white shadow-md group cursor-pointer"
                    >
                        <Image
                            src={img.image_url}
                            alt="Detail"
                            fill
                            sizes="(max-width: 768px) 25vw, 20vw"
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                    </div>
                ))}
            </div>

            {/* MODAL PHÓNG TO */}
            {selectedImg && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedImg(null)}
                >
                    <button className="absolute top-10 right-10 text-white text-5xl font-thin">&times;</button>
                    <div className="relative w-full h-full max-w-6xl max-h-[85vh]">
                        <Image
                            src={selectedImg}
                            alt="Full view"
                            fill
                            className="object-contain"
                            priority
                        />
                    </div>
                </div>
            )}
        </>
    );
}