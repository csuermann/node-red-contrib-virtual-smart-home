# Virtual Smart Home (VSH)

A Node-RED node that represents a virtual device which can be controlled via
Amazon Alexa. Requires the '_virtual smart home_' skill to be enabled for your
Amazon account.

## Availability

The _virtual smart home_ skill is available in the Amazon skill stores in the following locales:

- [English (AU)](https://skills-store.amazon.com.au/deeplink/dp/B08JV9RT7H?deviceType=app&share&refSuffix=ss_copy)
- [English (CA)](https://skills-store.amazon.ca/deeplink/dp/B08JV9RT7H?deviceType=app&share&refSuffix=ss_copy)
- [English (GB)](https://skills-store.amazon.co.uk/deeplink/dp/B08JV9RT7H?deviceType=app&share&refSuffix=ss_copy)
- [English (US)](https://skills-store.amazon.com/deeplink/dp/B08JV9RT7H?deviceType=app&share&refSuffix=ss_copy)
- [French (FR)](https://skills-store.amazon.fr/deeplink/dp/B08JV9RT7H?deviceType=app&share&refSuffix=ss_copy)
- [German (DE)](https://skills-store.amazon.de/deeplink/dp/B08JV9RT7H?deviceType=app&share&refSuffix=ss_copy)
- [Italian (IT)](https://skills-store.amazon.it/deeplink/dp/B08JV9RT7H?deviceType=app&share&refSuffix=ss_copy)
- [Spanish (ES)](https://skills-store.amazon.es/deeplink/dp/B08JV9RT7H?deviceType=app&share&refSuffix=ss_copy)

## Highlights

- supports a growing set of device types
  - Blinds
  - Color Changing Light Bulb
  - Dimmable Light Bulb
  - Dimmer Switch
  - Garage Door Opener
  - Plug
  - Switch
  - Temperature Sensor
- no separate account needed. Just link your existing Amazon account.
- new virtual devices can simply be dragged onto the Node-RED canvas and will
  proactively be discovered by Alexa. No need to ask Alexa to discover devices.
- devices removed from the Node-RED canvas will also be removed from Alexa. Orphaned 
  devices can also be manually removed from Alexa via the Node-RED editor.
- changes made to virtual device types and names will immediately be picked up by Alexa.
- local state changes of devices get synchronized with Alexa
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

The node also accepts incoming messages that can be used to inform Alexa about
local device changes, which will then be reflected in the Alexa app. If the
passthrough option is enabled, this will also trigger an outgoing message, just
like when the node gets invoked via Alexa. In this case `payload.source` is set
to `device` instead of `alexa`.

Please ensure that your setup does not send too many messages to Alexa. Othewise you risk getting your account blocked.

## Setup instructions

- In the Alexa app:
  1.  Search the skill store for the `virtual smart home` skill
  1.  Enable the 'virtual smart home' skill
  1.  Complete the account linking process by logging in with your Amazon account credentials.
- In Node-RED:
  1.  Install the `node-red-contrib-virtual-smart-home` module
  1.  Place a `virtual device` node onto the canvas and connect it to a debug node
  1.  Double click on the virtual device node to enter a name and select a device type. Once set up you can use this name to control the device via Alexa.
  1.  Configure a new `vsh-connection` by clicking the pen icon. (Only needed _once_ for each Amazon account) 
  1.  Follow the instructions to complete the account linking process. Make sure you use the same Amazon account credentials as above!
  1.  Deploy your Node-RED flow. This will trigger your virtual device to be discovered by Alexa. You should even get a push notification via the Alexa app (if notifications are enabled).
  1.  You should now be able to control your virtual device with your voice, e.g. by saying "Alexa, turn xxx on". Inspect the output of the connected debug node and consult the docs in order to do something useful.
  1.  Once you remove virtual devices from the canvas (and redeploy your flows), those devices will also be removed from Alexa.

## Docs

Detailed docs are shipped as part of the Node-RED package and available through
the 'help' panel.

## Examples

Example flows that illustrate the payload structure can be imported from the Node-RED import menu (Import > Examples > node-red-contrib-virtual-smart-home). They can also be found in the [examples](https://github.com/csuermann/node-red-contrib-virtual-smart-home/tree/master/examples) folder.

## Share the Love!

I dedicated endless hours to this project and really hope it adds value for you! Nothing is more rewarding to me than your feedback. So if you are a happy user, please
- rate the 'virtual smart home' skill on the Alexa skill store
- rate the 'virtual smart home' [Node-RED package](https://flows.nodered.org/node/node-red-contrib-virtual-smart-home)
- mention this package in your next blog post / podcast / YouTube
- [donate](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=PJ37WU5S4NZ2E&source=url) a few bucks to help cover the infrastructure costs.

__THANK YOU!__

## Terms of Use

This package comes without any warranty. Use it, enjoy it, but all at your own
risk. If you are satisfied with this project, please contribute your share for the backend infrastructure via [donation](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=PJ37WU5S4NZ2E&source=url). Thank you!

__NOTE__: Devices that have not been online for 30 days will be permanently deleted without prior warning. Their certificates will be invalidated and can no longer be used to connect virtual devices.

Accounts without any activity for 60 days will also be deleted and can no longer be used to control virtual devices.
