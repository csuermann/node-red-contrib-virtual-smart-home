# Virtual Smart Home (VSH)

A Node-RED node that represents a virtual device which can be controlled via
Amazon Alexa. Requires the '_virtual smart home_' skill to be enabled for your
Amazon account.

## Availability

The _virtual smart home_ skill is available in the Amazon skill stores in the following locales:

- [English (AU)](https://www.amazon.com.au/dp/B08JV9RT7H)
- [English (CA)](https://www.amazon.ca/dp/B08JV9RT7H)
- [English (GB)](https://www.amazon.co.uk/dp/B08JV9RT7H)
- [English (IN)](https://www.amazon.in/dp/B08JV9RT7H)
- [English (US)](https://www.amazon.com/dp/B08JV9RT7H)
- [French (FR)](https://www.amazon.fr/dp/B08JV9RT7H)
- [German (DE)](https://www.amazon.de/dp/B08JV9RT7H)
- [Italian (IT)](https://www.amazon.it/dp/B08JV9RT7H)
- [Portuguese (BR)](https://www.amazon.com.br/dp/B08JV9RT7H)
- [Spanish (ES)](https://www.amazon.es/dp/B08JV9RT7H)

## Highlights

- supports a growing set of device types
  - Blinds
  - Color Changing Light Bulb
  - Contact Sensor
  - Dimmable Light Bulb
  - Dimmer Switch
  - Entertainment Device
  - Fan
  - Garage Door Opener (en-US locale only)
  - Lock
  - Motion Sensor
  - Plug
  - Switch
  - Scene
  - Temperature Sensor
  - Thermostat
- no separate account needed. Just link your existing Amazon account.
- new virtual devices can simply be dragged onto the Node-RED canvas and will
  proactively be discovered by Alexa. No need to ask Alexa to discover devices.
- devices removed from the Node-RED canvas will also be removed from Alexa. Orphaned
  devices can also be manually removed from Alexa via the Node-RED editor.
- changes made to virtual device types and names will immediately be picked up by Alexa.
- local state changes of devices (e.g. thermostat values) get synchronized with Alexa
- secure communication with the IoT cloud through individually provisioned
  certificates

## What it does

The node gets invoked through Amazon Alexa (either via a voice command or via
the Alexa app) and outputs a `msg` object containing the updated device state as
payload. For example, when you say "Alexa, dim the kitchen light to 50 percent",
the following `msg` object will be emitted:

```JSON
{
  "topic": "home/kitchen/lights",
  "payload": {
    "brightness": 50,
    "powerState": "ON",
    "source": "alexa",
    "directive": "SetBrightness",
    "name": "kitchen light",
    "type": "DIMMABLE_LIGHT_BULB"
  }
}
```

The node also accepts inbound messages that can be used to inform Alexa about
local device changes, which will then be reflected in the Alexa app. If the
passthrough option is enabled, this will also trigger an outbound message, just
like when the node gets invoked via Alexa. In this case `payload.source` is set to `device` instead of `alexa`. If the inbound message has a `topic` attribute, its value will be present in the outbound msg instead of the topic configured in the editor.

Please ensure that your setup does not send too many messages to Alexa. Otherwise you risk getting your account blocked.

## Setup Instructions

### In the Alexa app

1. Search the skill store for the `virtual smart home` skill and enable it.
2. Complete the account linking process by logging in with your Amazon account credentials.

### In Node-RED

1. Install the `node-red-contrib-virtual-smart-home` module.
2. Place a `virtual device` node onto the canvas and connect it to a debug node.
3. Double-click on the virtual device node to enter a name and select a device type. Once set up, you can use this name to control the device via Alexa.
4. Configure a new `vsh-connection` by clicking the pen icon. (Only needed _once_ for each Amazon account).
5. Follow the instructions to complete the account linking process. Make sure you use the same Amazon account credentials as above.
6. Deploy your Node-RED flow. This will trigger your virtual device to be discovered by Alexa. You should even get a push notification via the Alexa app (if notifications are enabled).
7. You should now be able to control your virtual device with your voice, e.g., by saying "Alexa, turn xxx on". Inspect the output of the connected debug node and consult the docs to do something useful.
8. Once you remove virtual devices from the canvas (and redeploy your flows), those devices will also be removed from Alexa.

## Docs

Detailed docs are shipped as part of the Node-RED package and available through
the 'help' panel.

## Examples

Example flows that illustrate the payload structure and voice invocation phrases can be imported from the Node-RED import menu (Import > Examples > node-red-contrib-virtual-smart-home). They can also be found in the [examples](https://github.com/csuermann/node-red-contrib-virtual-smart-home/tree/master/examples) folder.

## Share the Love

I dedicated endless hours to this project and really hope it adds value for you! Nothing is more rewarding to me than your feedback. So if you are a happy user, please

- rate the 'virtual smart home' skill on the Alexa skill store
- rate the 'virtual smart home' [Node-RED package](https://flows.nodered.org/node/node-red-contrib-virtual-smart-home)
- mention this package in your next blog post / podcast / YouTube

**THANK YOU!**

## Changelog

New versions of VSH are frequently released and it is generally recommended to always run the latest version. The Changelog is published in the [Releases](https://github.com/csuermann/node-red-contrib-virtual-smart-home/releases) section on GitHub.

## FAQ

1. Q: Which voice commands can I use to control my devices with Alexa?

   A: Take a look at the [example flows](https://github.com/csuermann/node-red-contrib-virtual-smart-home/tree/master/examples) which you can import from the Node-RED import menu (Import > Examples > node-red-contrib-virtual-smart-home).

   Here are some of the most often used commands:

   - Alexa, switch on / off DEVICE-NAME
   - Alexa, set DEVICE-NAME to X percent
   - Alexa, set DEVICE-NAME to Warm white / Soft white / Daylight white / Cool white / Red / Crimson / Salmon / Orange / Gold / Yellow / Green / Turquoise / Cyan / Sky blue / Blue / Purple / Magenta / Pink / Lavender
   - Alexa, open / close DEVICE-NAME

1. Q: How can I control devices in a specific room?

   A: You can create rooms in the Alexa app and assign your devices to them. Create a room which groups together an Alexa device (e.g. Echo) and some virtual lights. You can then control all those lights simply by speaking "Alexa, switch off the light" into the Alexa device.

1. Q: Why do my devices suddenly fail to connect and show up as 'offline'?

   A: If your device was not connected to the VSH backend for more than 30 days its certificate will be revoked. You can fix that by deleting the old connection, creating a new one and linking your virtual devices to the new one. All your devices should then get re-discovered by Alexa.

   Another reason could be that you are using an outdated version of VSH. Please update to the latest version (e.g using the Node-RED palette manager).

1. Q: Why do some of my devices show up as duplicates in the Alexa app?

   A: Your duplicate devices might belong to a vsh-connection that no longer exists. You can delete them manually on the connection page where they probably show up with a shaded background, indicating they belong to another vsh-connection.

1. Q: I deleted a virtual device but Alexa keeps rediscovering it!

   A: You probably deleted the device in the Alexa app instead of Node-RED. Open the connection page which lists all known devices and click the trash icon next to the device you want to delete.

1. Q: Why does VSH not work offline?

   A: Alexa lives in the cloud. When you ask Alexa to control one of your devices, your voice is sent to Amazon servers for processing. Amazon's servers then try to make sense of what you said and which skill to invoke. If you said "Alexa, dim the kitchen light to fifty percent!", Alexa will realize that 'kitchen light' belongs to the VSH skill and invoke the VSH backend with a 'directive' containing the command that was understood (e.g. 'SetBrightness'). The VSH skill backend then sends a message to your connected virtual device which triggers an outgoing msg object with the device state for you to make use of. This requires your VSH devices to be online.

1. Q: What do you do with my data?

   A: The VSH backend only stores metadata about your configured devices needed for VSH to function and your basic profile information provided by Amazon when you enabled the skill. Neither your Amazon password nor your voice prompts or your location is ever shared with VSH. I also have no interest in analyzing your usage patterns although this _would technically_ be possible.

1. Q: Where can I see what data is being sent to / received from the backend?

   A: Activate the `Debug` option on the connection page and observe the output logged to stdout.

1. Q: Can I run my own backend?

    A:  Yes! Check out the [backend repository](https://github.com/csuermann/virtual-smart-home/) and follow the instructions precisely. Keep in mind that it might be cheaper and much easier to keep using the official backend.

1. Q: Is there a way to persist the state of devices across restarts of Node-RED?

   A: Yes! The device state is stored as 'context' provided by Node-RED, which is kept in memory by default. You can easily change that by adding this snippet to your Node-RED's settings.js file:

   ```javascript
   contextStorage: {
     default: {
       module: "localfilesystem",
     },
   },
   ```

1. Q: In which way is the FREE plan limited?

   A: While you can use the FREE plan free of charge for as long as you want, it is currently limited to 7 virtual devices and doesn't support retrieving device state by Alexa, e.g. commands like "Alexa, what's the temperature in the living room" will fail.

1. Q: Why did a paid PRO plan get introduced?

   A: With growing popularity of VSH the infrastructure costs also grew significantly. I had to make a decision to either shut VSH down or to introduce a paid plan. For 12 EUR per year, you can deploy up to 200 virtual devices and support further development of VSH. You can upgrade to the "Pro" plan from the Connection dialog within Node-RED.

1. Q: Where can I manage my VSH subscription?

   A: Click the 'manage subscription' button on the vsh-connection page in Node-RED or manually log into the [Stripe dashboard](https://billing.stripe.com/p/login/6oE00vdQ62Tp3LidQQ). This will only work when you already have purchased a subscription.

1. Q: Can you add feature X, please?

   A: I'm always eager to hear your ideas! Please [file a ticket](https://github.com/csuermann/node-red-contrib-virtual-smart-home/issues/new).

1. Q: Where can I ask a question that hasn't been addressed yet?

   A: Check out [existing issues](https://github.com/csuermann/node-red-contrib-virtual-smart-home/issues) on GitHub or [file a new ticket](https://github.com/csuermann/node-red-contrib-virtual-smart-home/issues/new).

## Terms of Use

This package comes without any warranty. Use it, enjoy it, but all at your own risk.
If you are satisfied with this project, consider upgrading to the PRO plan or [buying me a coffee](https://paypal.me/cornelius/5). Thank you!

### NOTE

The permitted use of the VSH package is limited to human-triggered interactions with Alexa and _infrequent_ synchronizations of device states (e.g. for sensor data, such as thermostat). Any setup that leads to excessive data traffic between the VSH client and its backend is strictly forbidden and will lead to permanent blocking of the user's account.

Devices that have not been online for 30 days will be permanently deleted without prior warning. Their certificates will be invalidated and can no longer be used to connect virtual devices.

Accounts without any activity for 60 days will also be deleted and can no longer be used to control virtual devices.
