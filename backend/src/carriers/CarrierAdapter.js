/**
 * Base contract for carrier integrations.
 *
 * Each carrier (UPS, DHL, Colissimo, FedEx, ...) implements this interface.
 * The adapter is responsible for calling the carrier's API and normalizing
 * its response into the app's { shipment, events } shape.
 */

export class CarrierAdapter {
  /** Unique carrier code, e.g. "ups". */
  get code() {
    throw new Error('Not implemented');
  }

  /** Human-readable carrier name, e.g. "UPS". */
  get name() {
    throw new Error('Not implemented');
  }

  /**
   * Whether this adapter recognizes the given tracking number format.
   * Used to auto-detect the carrier when it is not specified.
   * @param {string} _trackingNumber
   * @returns {boolean}
   */
  matches(_trackingNumber) {
    return false;
  }

  /**
   * Fetch tracking data from the carrier API and normalize it.
   * @param {string} _trackingNumber
   * @returns {Promise<{shipment: object, events: object[]} | null>}
   */
  async track(_trackingNumber) {
    throw new Error('Not implemented');
  }
}
