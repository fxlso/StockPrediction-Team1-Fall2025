import type { User } from '@/types/user';
import React from 'react'

type WatchlistProps = {
  user: User | null;
}

export default function Watchlist(user: WatchlistProps) {
  return (
    <div>Watchlist</div>
  )
}
