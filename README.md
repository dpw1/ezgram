# Starting the project:

1. Check if your [Node.js](https://nodejs.org/) version is >= **14**.
2. Clone this repository.
3. Change the package's `name`, `description`, and `repository` fields in `package.json`.
4. Change the name of your extension on `src/manifest.json`.
5. Run `npm install` to install the dependencies.
6. Run `npm start`
7. Load your extension on Chrome following:
   1. Access `chrome://extensions/`
   2. Check `Developer mode`
   3. Click on `Load unpacked extension`
   4. Select the `build` folder.
8. Happy hacking.

# Important notes

## Using strings for 'true' and 'false' instead of boolean

- The _useStickyState_ was not working properly with booleans, so most modules are using the strings "yes" for _true_ and "no" for _false_.

## Intro text (please add on install)

Thank you for installing the Easy Insta Bot!

Easy Insta Bot is an automation tool for Instagram that mimics human behaviour. Before proceeding, it's very important to keep some things in mind:

1. Backup the database often

Easy Insta Bot saves all users you have followed and unfollowed in a local database. This prevents that you keep following the same person over and over again. However, if you remove the app, this database will be permanently deleted.

Make sure to do regular backups by navigating to Database > Export.

2. Moderation is key

As far as our tests can tell, Instagram does not recognize this tool as a bot, but this does not mean you can follow users all day long.

To play it safe, we recommend not following or un-following more than 80 accounts per day. Make sure you have at least 40 seconds of delay between actions.

You're more than welcome to play around with these numbers and see what works best for you, but kindly be mindful that this can potentially result in timeouts, bans or shadow bans.

3. Feedback

Please send us an email with any bugs or suggestions that you may have.

Thank you!
