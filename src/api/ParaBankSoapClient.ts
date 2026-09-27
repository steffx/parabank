import { APIRequestContext, APIResponse, test } from '@playwright/test';
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

export interface SoapResult<T = Record<string, unknown>> {
  status: number;
  xml: string;
  /** Content of <operationResponse> when successful. */
  body?: T;
  /** Parsed <Fault> when the service returned a SOAP fault. */
  fault?: { faultcode: string; faultstring: string };
}

const escapeXml = (v: string): string =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/**
 * Minimal SOAP 1.1 client for /services/ParaBank.
 *
 * ParaBank is document/literal wrapped with qualified parameters, so every child element
 * of the operation lives in the service namespace (prefix "ser").
 */
export class ParaBankSoapClient {
  constructor(private readonly request: APIRequestContext) {}

  /** Build a SOAP envelope for `operation` with the given (ordered) parameters. */
  static envelope(operation: string, params: Record<string, string | number> = {}): string {
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
  async sendRaw(xml: string): Promise<APIResponse> {
    return this.request.post(endpoints.soapParaBank, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8', SOAPAction: '""' },
      data: xml,
    });
  }

  async call<T = Record<string, unknown>>(
    operation: string,
    params: Record<string, string | number> = {},
  ): Promise<SoapResult<T>> {
    return test.step(`SOAP ${operation}`, async () => {
      const res = await this.sendRaw(ParaBankSoapClient.envelope(operation, params));
      const xml = await res.text();
      const doc = parser.parse(xml) as { Envelope?: { Body?: Record<string, unknown> } };
      const bodyNode = doc.Envelope?.Body ?? {};
      if ('Fault' in bodyNode) {
        return { status: res.status(), xml, fault: bodyNode.Fault as SoapResult['fault'] };
      }
      return { status: res.status(), xml, body: bodyNode[`${operation}Response`] as T };
    });
  }

  /** Parse any XML string with the suite's parser settings (namespace prefixes removed). */
  static parse<T = Record<string, unknown>>(xml: string): T {
    return parser.parse(xml) as T;
  }
}
