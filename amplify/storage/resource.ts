import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
    name: 'musicDrive',
    access: (allow) => ({
        'tracks/*': [
            allow.guest.to(['read', 'write', 'delete'])
        ]
    })
});
