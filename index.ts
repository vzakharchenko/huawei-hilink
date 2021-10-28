import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {startSession} from "./src/startSession";
import {
    deleteMessage,
    getContactSMSPages,
    getSMSByUsers,
    getSMSContacts,
    getSMSPages,
    sendMessage
} from "./src/ListSMS";
import {controlMobileData, reconnect, status} from "./src/MobileData";

// @ts-ignore
yargs(hideBin(process.argv))
    .command('sendSMS', 'send SMS to contact or group of contacts', (yargs) => {
        return yargs
            .positional('url', {
                describe: 'huawei host',
                default: '192.168.8.1'
            }).positional('phone', {
                describe: 'phones with ; as separator ',
                type:"string",
            }).positional('message', {
                describe: 'text message ',
                type:"string",
            })
    }, async (argv) => {
        const sessionData = await startSession(argv.url);
        if (!argv.phone) {
            throw new Error('Phone number is not defined');
            return;
        }
        await sendMessage(sessionData, argv.phone, argv.message||'');
    }).command('contacts', 'get contact list with the latest sms messages', (yargs) => {
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1'
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
}).command('contactPages', 'contact list pages', (yargs) => {
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1'
        }).positional('exportFile', {
            describe: 'export to file',
            default: './contactsCount.list'
        }).positional('exportFormat', {
            describe: 'export format (xml, json, none)',
            default: 'none'
        })
}, async (argv) => {
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
}).command('sms', 'get contact SMS list', (yargs) => {
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1',
        }).positional('phone', {
            describe: 'contact phone number',
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
}).command('pages', 'count of sms pages', (yargs) => {
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1'
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
}).command('deleteSMS', 'delete sms by smsId', (yargs) => {
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1'
        }).positional('messageId', {
            describe: 'messageId or index',
            type: 'string'
        })
}, async (argv) => {
    const sessionData = await startSession(argv.url);
    if (!argv.messageId) {
        throw new Error('messageId is not defined');
    }
    await deleteMessage(sessionData, argv.messageId);
}).command('mobileData', 'Enable/Disable or Reconnect Mobile Data', (yargs) => {
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1'
        }).positional('mode', {
            describe: 'change mobile data to on,off or reconnect',
        })
}, async (argv) => {
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
}).command('monitoring', 'current Monitoring status', (yargs) => {
// @ts-ignore
    return yargs
        .positional('url', {
            describe: 'huawei host',
            default: '192.168.8.1'
        }).positional('exportFile', {
            describe: 'export to file',
            default: './monitoring.log'
        }).positional('exportFormat', {
            describe: 'export format (xml, json, none)',
            default: 'none'
        })
}, async (argv) => {
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
})
    // .option('verbose', {
    //     alias: 'v',
    //     type: 'boolean',
    //     description: 'Run with verbose logging'
    // })
    .parse()
