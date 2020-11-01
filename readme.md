# Virtual Smart Home

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
  - Switch
  - Plug
  - Dimmable Light Bulb
  - Color Changing Light Bulb
  - Dimmer Switch
  - Blinds
  - Garage Door Opener
- no separate account needed. Just link your existing Amazon account.
- new virtual devices can simply be dragged onto the Node-RED canvas and will
  proactively be discovered by Alexa. No need to ask Alexa to discover devices.
- devices that are no longer needed can be removed from Alexa via the Node-RED
  editor.
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
  "brightness":50,
  "powerState":"ON",
  "source":"alexa",
  "name":"kitchen light",
  "type":"DIMMABLE_LIGHT_BULB"
}
```

The node also accepts incoming messages that can be used to inform Alexa about
local device changes, which will then be reflected in the Alexa app. If the
passthrough option is enabled, this will also trigger an outgoing message, just
like when the node gets invoked via Alexa. In this case `payload.source` is set
to `device` instead of `alexa`.

## Setup instructions

- In the Alexa app:
   1. Search the skill store for the `virtual smart home` skill
   1. Enable the 'virtual smart home' skill
   1. Complete the account linking process by logging in with your Amazon account credentials
- In Node-RED:
   1. Install the `node-red-contrib-virtual-smart-home` module
   1. Place a `virtual device` node onto the canvas and connect it to a debug node
   1. Double click on the virtual device node to enter a name and select a device type. Once set up you can use this name to control the device via Alexa.
   1. Configure a new `vsh-connection` by clicking the pen icon
   1. Follow the instructions to complete the account linking process. Make sure you use the same Amazon account credentials as above!
   1. Deploy your Node-RED flow. This will trigger your virtual device to be discovered by Alexa. You should even get a push notification via the Alexa app (if notifications are enabled).
   1. You should now be able to control your virtual device with your voice, e.g. by saying "Alexa, turn xxx on". Inspect the output of the connected debug node and consult the docs in order to do something useful.

## Docs

Detailes docs are shipped as part of the Node-RED package and available through
the 'help' panel.

## Warranty

This package comes without any warranty. Use it, enjoy it, but all at your own
risk.
