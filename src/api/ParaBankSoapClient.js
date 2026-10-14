import { test } from '@playwright/test';
import { XMLParser } from 'fast-xml-parser';
import { endpoints } from './endpoints';

/** Target namespace of the ParaBank JAX-WS service (ParaBankServiceConstants.TNS). */
export const PARABANK_TNS = 'http://service.parabank.parasoft.com/';

const parser = new XMLParser({
  removeNSPrefix: true,
  ignoreAttributes: false,
  parseTagValue: true,
  // Elements that can repeat must always parse as arrays, even when only one is returned.
  isArray: (name) => ['account', 'transaction', 'position', 'historyPoint'].includes(name),
});

/**
 * @template [T=Record<string, unknown>]
 * @typedef {object} SoapResult
 * @property {number} status
 * @property {string} xml
 * @property {T} [body] Content of <operationResponse> when successful.
 * @property {{faultcode: string, faultstring: string}} [fault] Parsed <Fault> when the service returned a SOAP fault.
 */

const escapeXml = (v) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Minimal SOAP 1.1 client for /services/ParaBank.
 *
 * ParaBank is document/literal wrapped with qualified parameters, so every child element
 * of the operation lives in the service namespace (prefix "ser").
 */
export class ParaBankSoapClient {
  constructor(request) {
    this.request = request;
  }

  /** Build a SOAP envelope for `operation` with the given (ordered) parameters. */
  static envelope(operation, params = {}) {
    const children = Object.entries(params)
      .map(([k, v]) => `<ser:${k}>${escapeXml(String(v))}</ser:${k}>`)
      .join('');
    return (
      `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="${PARABANK_TNS}">` +
      `<soapenv:Header/><soapenv:Body><ser:${operation}>${children}</ser:${operation}></soapenv:Body>` +
      `</soapenv:Envelope>`
    );
  }

  /** Send a raw XML string (useful for malformed-envelope tests). */
  async sendRaw(xml) {
    return this.request.post(endpoints.soapParaBank, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '""' },
      data: xml,
    });
  }

  async call(operation, params = {}) {
    return test.step(`SOAP ${operation}`, async () => {
      const res = await this.sendRaw(ParaBankSoapClient.envelope(operation, params));
      const xml = await res.text();
      const doc = parser.parse(xml);
      const bodyNode = doc.Envelope?.Body ?? {};
      if ('Fault' in bodyNode) {
        return { status: res.status(), xml, fault: bodyNode.Fault };
      }
      return { status: res.status(), xml, body: bodyNode[`${operation}Response`] };
    });
  }

  /** Parse any XML string with the suite's parser settings (namespace prefixes removed). */
  static parse(xml) {
    return parser.parse(xml);
  }
}
