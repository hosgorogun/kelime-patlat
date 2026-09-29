import { useState, useEffect } from "react";
import { socialManager, type FriendRequest, type FriendUser } from "../shared/social";

export function useSocialState() {
  const [friendsList, setFriendsList] = useState<FriendUser[]>(() => socialManager.getFriends());
  const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>(() => socialManager.getPendingRequests());
  const [notice, setNotice] = useState("");

  useEffect(() => {
    const unsub = socialManager.subscribe(() => {
      setPendingRequests([...socialManager.getPendingRequests()]);
      setFriendsList([...socialManager.getFriends()]);
    });
    return unsub;
  }, []);

  return {
    friendsList,
    setFriendsList,
    pendingRequests,
    setPendingRequests,
    notice,
    setNotice,
  };
}
