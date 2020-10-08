# Virtual Smart Home

A Node-RED node that represents a virtual device which can be controlled via
Amazon Alexa. Requires the '_virtual smart home_' skill to be enabled for your
Amazon account.

## Availability

The _virtual smart home_ skill is currently available in the Amazon skill stores
of

- [Germany](https://skills-store.amazon.de/deeplink/dp/B08JV9RT7H?deviceType=app&share&refSuffix=ss_copy)
- [UK](https://skills-store.amazon.co.uk/deeplink/dp/B08JV9RT7H?deviceType=app&share&refSuffix=ss_copy)
- [France](https://skills-store.amazon.fr/deeplink/dp/B08JV9RT7H?deviceType=app&share&refSuffix=ss_copy)
- [Italy](https://skills-store.amazon.it/deeplink/dp/B08JV9RT7H?deviceType=app&share&refSuffix=ss_copy)
- [Spain](https://skills-store.amazon.es/deeplink/dp/B08JV9RT7H?deviceType=app&share&refSuffix=ss_copy)

Non-Europe locales will be supported shortly.

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
- new virtual devices can simply be draged onto the Node-RED canvas and will
  proactively be discovered by Alexa. No need to ask Alexa to discover devices.
- devices that are no longer needed can be removed from Alexa via the Node-RED
  editor.
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
  "source":"alexa"
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
