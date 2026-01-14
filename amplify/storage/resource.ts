import { defineStorage } from '@aws-amplify/backend';

export const storage = defineStorage({
    name: 'musicDrive',
    access: (allow) => ({
        'tracks/*': [
            allow.authenticated.to(['read', 'write', 'delete']),
            allow.guest.to(['read'])
        ]
    })
});
