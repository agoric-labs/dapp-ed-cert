import { heapVowE as E } from '@agoric/vow/vat.js';
/**
 * @import {ZoeTools} from '@agoric/orchestration/src/utils/zoe-tools.js';
 * @import {Orchestrator} from '@agoric/orchestration';
 * @import {Vow} from '@agoric/vow';
 */

/**
 * Publishes certification data to storage
 *
 * @param {Orchestrator} orch
 * @param {{
 *   vowTools: any,
 *   certificateDataRoot: any,
 *   getCurrentTimestamp: () => number,
 *   maxCertificates: bigint
 * }} ctx
 * @param {ZCFSeat} seat
 * @param {{ edCert: object }} offerArgs
 */
export const publishEdCert = async (orch, ctx, seat, offerArgs) => {
  const { edCert } = offerArgs;

  const { certificateDataRoot, vowTools, getCurrentTimestamp } = ctx;
  const currentTimestamp = await getCurrentTimestamp();

  // Validate data structure
  const requiredFields = [
    'certificateId',
    'studentName',
    'courseName',
    // startDate,
    // endDate: '',
    // instituteName: '',
    // instituteAddress: '',
    // certifyingAuthority: '',
    // authorityDesignation: '',
    // authoritySignature: '', // Base64 image
    // instituteLogo: '', // Base64 image
    // grade: '',
    // achievements: '',
    // specialization: '',
    'certificateType', // degree, diploma, certificate
  ];
  if (edCert.photo) {
    if (
      typeof edCert.photo !== 'string' ||
      !edCert.photo.startsWith('data:image/')
    ) {
      return harden(new Error('Invalid patient photo data structure'));
    }
  }
  if (
    !requiredFields.every(
      field =>
        Object.prototype.hasOwnProperty.call(edCert, field) &&
        edCert[field] !== null &&
        edCert[field] !== undefined,
    )
  ) {
    return harden(
      new Error('Invalid patient data structure - missing required fields'),
    );
  }

  try {
    // UNTIL https://github.com/Agoric/agoric-sdk/issues/9066
    const edCertNode = E(certificateDataRoot).makeChildNode(edCert.certificateId);
    /** @type {(msg: string) => Vow<void>} */
    // vowTools.watch(E(edCertNode).setValue(JSON.stringify(edCert)));
    await E(edCertNode).setValue(JSON.stringify(edCert));

    seat.exit();
    return `Certification data published successfully at ${currentTimestamp}`;
  } catch (error) {
    console.error('Error publishing Certification data:', error);
    return harden(new Error('Failed to publish Certification data'));
  }
};
harden(publishEdCert);
