# Virtual Smart Home

A Node-RED node that represents a virtual device which can be controlled via
Alexa. Requires the 'virtual smart home' skill to be enabled for your Amazon
account.

## Highlights

- supports a growing set of device types
  - Switch
  - Plug
  - Dimmable Light Bulb
  - Color Changing Light Bulb
  - Dimmer Switch
  - Blinds
  - Garage Door Opener
- new virtual devices will proactively be discovered by Alexa. No need to ask
  Alexa to discover devices.
- no separate account needed. Just link your existing Amazon account.
- local state changes of devices get synchronized with Alexa
- secure communication with the IoT cloud through individually provisioned
  certificates

## What it does

The node gets invoked through Amazon Alexa (either via a voice command or via
the Alexa app) and outputs a `msg` object containing the updated device state as
payload.

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
