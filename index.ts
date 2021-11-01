import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {login, logout, startSession} from "./src/startSession";
import {
    deleteMessage,
    getContactSMSPages,
    getInBoxSMS,
    getSMSByUsers,
    getSMSContacts,
    getSMSPages,
    sendMessage
} from "./src/ListSMS";
import {controlMobileData, reconnect, status} from "./src/MobileData";
import {getSignalInfo, lteBand} from "./src/Signal";

const huawei = require('./jslib/public');

async function delay(ms: number) {
    return new Promise(res => setTimeout(res, ms));
}

// @ts-ignore
yargs(hideBin(process.argv))
    .command('sendSMS', 'send SMS to contact or group of contacts', (yargs) => {
        // @ts-ignore
        return yargs
            .positional('url', {
                describe: 'huawei host',
                default: '192.168.8.1'
            })
            .positional('username', {
                describe: 'huawei username',
                default: 'admin'
            })
            .positional('password', {
                describe: 'huawei password',
                type: 'string'
            }).positional('phone', {
                describe: 'phones with ; as separator ',
                type: "string",
            }).positional('message', {
                describe: 'text message ',
                type: "string",
            })
    }, async (argv) => {
        huawei.publicKey.rsapadingtype = argv.rsapadingtype || "1";
        await login(argv.url, argv.username, argv.password);
        try {
            const sessionData = await startSession(argv.url);
            if (!argv.phone) {
                throw new Error('Phone number is not defined');
                return;
            }
            await sendMessage(sessionData, argv.phone, argv.message || '');
        } finally {
            await logout(argv.url);
        }
    }).command('contacts', 'get contact list with the latest sms messages', (yargs) => {
    // @ts-ignore
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1'
        })
        .positional('username', {
            describe: 'huawei username',
            default: 'admin'
        })
        .positional('password', {
            describe: 'huawei password',
            type: 'string'
        }).positional('page', {
            describe: 'sms page',
            default: 1
        }).positional('exportFile', {
            describe: 'export to file',
            default: './contacts.list'
        }).positional('exportFormat', {
            describe: 'export format (xml, json, none)',
            default: 'none'
        })
}, async (argv) => {
    huawei.publicKey.rsapadingtype = argv.rsapadingtype || "1";
    await login(argv.url, argv.username, argv.password);
    try {
        const sessionData = await startSession(argv.url);
        switch (argv.exportFormat) {
            case 'json': {
                break;
            }
            case 'xml': {
                break;
            }
            case 'none': {
                break;
            }
            default: {
                throw new Error(`export Format ${argv.exportFile} does not supported: supported only: xml,json,none`)
            }
        }

        await getSMSContacts(sessionData, argv.page, argv.exportFile, argv.exportFormat);
    } finally {
        await logout(argv.url);
    }
}).command('messages', 'get all messages from InBox', (yargs) => {
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1'
        }).positional('deleteAfter', {
            describe: 'delete all messages after reading ',
            default: false
        })
        .positional('username', {
            describe: 'huawei username',
            default: 'admin'
        })
        .positional('password', {
            describe: 'huawei password',
            type: 'string'
        })
        .positional('exportFile', {
            describe: 'export to file',
            default: './inbox.list'
        }).positional('exportFormat', {
            describe: 'export format (xml, json, none)',
            default: 'none'
        })
}, async (argv) => {
    await login(argv.url, argv.username, argv.password);
    try {
        const sessionData = await startSession(argv.url);
        switch (argv.exportFormat) {
            case 'json': {
                break;
            }
            case 'none': {
                break;
            }
            default: {
                throw new Error(`export Format ${argv.exportFile} does not supported: supported only: json,none`)
            }
        }
        await getInBoxSMS(sessionData, argv.deleteAfter, argv.exportFile, argv.exportFormat);
    } finally {
        await logout(argv.url);
    }
}).command('contactPages', 'contact list pages', (yargs) => {
    // @ts-ignore
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1'
        })
        .positional('username', {
            describe: 'huawei username',
            default: 'admin'
        })
        .positional('password', {
            describe: 'huawei password',
            type: 'string'
        }).positional('exportFile', {
            describe: 'export to file',
            default: './contactsCount.list'
        }).positional('exportFormat', {
            describe: 'export format (xml, json, none)',
            default: 'none'
        })
}, async (argv) => {
    huawei.publicKey.rsapadingtype = argv.rsapadingtype || "1";
    await login(argv.url, argv.username, argv.password);
    try {
        const sessionData = await startSession(argv.url);

        switch (argv.exportFormat) {
            case 'json': {
                break;
            }
            case 'xml': {
                break;
            }
            case 'none': {
                break;
            }
            default: {
                throw new Error(`export Format ${argv.exportFile} does not supported: supported only: xml,json,none`)
            }
        }
        await getSMSPages(sessionData, argv.exportFile, argv.exportFormat);
    } finally {
        await logout(argv.url);
    }
}).command('sms', 'get contact SMS list', (yargs) => {
    // @ts-ignore
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1',
        }).positional('phone', {
            describe: 'contact phone number',
            type: 'string'
        })
        .positional('username', {
            describe: 'huawei username',
            default: 'admin'
        })
        .positional('password', {
            describe: 'huawei password',
            type: 'string'
        }).positional('page', {
            describe: 'sms page',
            default: 1
        }).positional('exportFile', {
            describe: 'export to file',
            default: './sms.list'
        }).positional('exportFormat', {
            describe: 'export format (xml, json, none)',
            default: 'none'
        }).positional('deleteAfter', {
            describe: 'delete all messages after reading ',
            default: false
        })
}, async (argv) => {
    huawei.publicKey.rsapadingtype = argv.rsapadingtype || "1";
    await login(argv.url, argv.username, argv.password);
    try {
        const sessionData = await startSession(argv.url);
        if (!argv.phone) {
            throw new Error('phone is not defined');
        }
        switch (argv.exportFormat) {
            case 'json': {
                break;
            }
            case 'xml': {
                break;
            }
            case 'none': {
                break;
            }
            default: {
                throw new Error(`export Format ${argv.exportFile} does not supported: supported only: xml,json,none`)
            }
        }
        await getSMSByUsers(sessionData, argv.phone, argv.page, argv.exportFile, argv.exportFormat, argv.deleteAfter);
    } finally {
        await logout(argv.url);
    }
}).command('pages', 'count of sms pages', (yargs) => {
// @ts-ignore
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1'
        })
        .positional('username', {
            describe: 'huawei username',
            default: 'admin'
        })
        .positional('password', {
            describe: 'huawei password',
            type: 'string'
        }).positional('phone', {
            describe: 'contact phone number',
            type: 'string'
        }).positional('exportFile', {
            describe: 'export to file',
            default: './smsCount.list'
        }).positional('exportFormat', {
            describe: 'export format (xml, json, none)',
            default: 'none'
        })
}, async (argv) => {
    huawei.publicKey.rsapadingtype = argv.rsapadingtype || "1";
    await login(argv.url, argv.username, argv.password);
    try {
        const sessionData = await startSession(argv.url);
        if (!argv.phone) {
            throw new Error('phone is not defined');
        }
        switch (argv.exportFormat) {
            case 'json': {
                break;
            }
            case 'xml': {
                break;
            }
            case 'none': {
                break;
            }
            default: {
                throw new Error(`export Format ${argv.exportFile} does not supported: supported only: xml,json,none`)
            }
        }
        await getContactSMSPages(sessionData, argv.phone, argv.exportFile, argv.exportFormat);
    } finally {
        await logout(argv.url);
    }
}).command('deleteSMS', 'delete sms by smsId', (yargs: any) => {
    // @ts-ignore
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1'
        })
        .positional('username', {
            describe: 'huawei username',
            default: 'admin'
        })
        .positional('password', {
            describe: 'huawei password',
            type: 'string'
        }).positional('messageId', {
            describe: 'messageId or index',
            type: 'string'
        })
}, async (argv: any) => {
    huawei.publicKey.rsapadingtype = argv.rsapadingtype || "1";
    await login(argv.url, argv.username, argv.password);
    try {
        const sessionData = await startSession(argv.url);
        if (!argv.messageId) {
            throw new Error('messageId is not defined');
        }
        await deleteMessage(sessionData, argv.messageId);
    } finally {
        await logout(argv.url)
    }
}).command('mobileData', 'Enable/Disable or Reconnect Mobile Data', (yargs: any) => {
    // @ts-ignore
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1'
        }).positional('username', {
            describe: 'huawei username',
            default: 'admin'
        })
        .positional('password', {
            describe: 'huawei password',
            type: 'string'
        }).positional('mode', {
            describe: 'change mobile data to on,off or reconnect',
        })
}, async (argv: any) => {
    huawei.publicKey.rsapadingtype = argv.rsapadingtype || "1";
    await login(argv.url, argv.username, argv.password);
    try {
        const sessionData = await startSession(argv.url);
        switch (argv.mode) {
            case 'reconnect': {
                await reconnect(sessionData);
                return;
            }
            case 'on': {
                break;
            }
            case 'off': {
                break
            }
            default: {
                throw new Error('Does not support Mode: ' + argv.mode + '. Supported only on,off,reconnect')
            }
        }
        await controlMobileData(sessionData, argv.mode);
    } finally {
        await logout(argv.url);
    }
}).command('monitoring', 'current Monitoring status', (yargs: any) => {
// @ts-ignore
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1'
        }).positional('username', {
            describe: 'huawei username',
            default: 'admin'
        })
        .positional('password', {
            describe: 'huawei password',
            type: 'string'
        }).positional('exportFile', {
            describe: 'export to file',
            default: './monitoring.log'
        }).positional('exportFormat', {
            describe: 'export format (xml, json, none)',
            default: 'none'
        })
}, async (argv: any) => {
    huawei.publicKey.rsapadingtype = argv.rsapadingtype || "1";
    await login(argv.url, argv.username, argv.password);
    try {
        const sessionData = await startSession(argv.url);
        switch (argv.exportFormat) {
            case 'json': {
                break;
            }
            case 'xml': {
                break;
            }
            case 'none': {
                break;
            }
            default: {
                throw new Error(`export Format ${argv.exportFile} does not supported: supported only: xml,json,none`)
            }
        }
        await status(sessionData, argv.exportFile, argv.exportFormat);
    } finally {
        await logout(argv.url);
    }
}).command('signalInfo', 'current device signal status', (yargs: any) => {
// @ts-ignore
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1'
        }).positional('username', {
            describe: 'huawei username',
            default: 'admin'
        })
        .positional('password', {
            describe: 'huawei password',
            type: 'string'
        }).positional('turn', {
            alias: 't',
            describe: 'Request Signal info until interrupted',
            default: false,
        })
}, async (argv: any) => {
    huawei.publicKey.rsapadingtype = argv.rsapadingtype || "1";
    await login(argv.url, argv.username, argv.password);
    try {
        const sessionData = await startSession(argv.url);
        if (argv.turn) {
            while (true) {
                await getSignalInfo(sessionData);
                await delay(2500)
            }
        } else {
            await getSignalInfo(sessionData);
        }
    } finally {
        await logout(argv.url);
    }
}).command('changeLteBand', 'change LTE band', (yargs: any) => {
// @ts-ignore
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1'
        }).positional('username', {
            describe: 'huawei username',
            default: 'admin'
        })
        .positional('password', {
            describe: 'huawei password',
            type: 'string'
        }).positional('band', {
            alias: 'band',
            describe: 'desirable LTE band number, separated by + char (example 1+3+20).If you want to use every supported bands, write \'AUTO\'.", "AUTO"',
            default: 'AUTO',
            type:'string'
        })
}, async (argv: any) => {
    if (!argv.band){
        throw new Error('Band is empty')
    }
    huawei.publicKey.rsapadingtype = argv.rsapadingtype || "1";
    await login(argv.url, argv.username, argv.password);
    try {
       await lteBand(await startSession(argv.url),argv.band);
    } finally {
        await logout(argv.url);
    }
})
    .option('rsapadingtype', {
        type: 'string',
        description: 'rsapadingtype, to check your run in web-console: MUI.LoginStateController.rsapadingtype',
        default: '1'
    })
    .parse()
