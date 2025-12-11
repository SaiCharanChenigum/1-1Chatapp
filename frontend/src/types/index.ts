export type User = {
    id: string;
    username: string;
    lastSeenAt?: string;
};

export type Message = {
    id: string;
    fromUserId: string;
    toUserId: string;
    text?: string;
    imageUrl?: string;
    createdAt: string;
    fromUser?: {
        username: string;
    };
};
