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

## Docs

Detailes docs are shipped as part of the Node-RED package and available through
the 'help' panel.

## Warranty

This package comes without any warranty. Use it, enjoy it, but all at your own
risk.
