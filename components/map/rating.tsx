"use client"
import { useState } from 'react'
export default function Rating() {
    const [rating, setRating] = useState(0)

    const handleRating = (value: number) => {
        setRating(value)
    }

    return (
        <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
                <button
                    key={star}
                    onClick={() => handleRating(star)}
                    className={`text-2xl ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
                >
                    ★
                </button>
            ))}
        </div>
    )
}