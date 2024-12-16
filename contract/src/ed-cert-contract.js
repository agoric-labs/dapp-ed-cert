// @ts-check
import { heapVowE as E } from '@agoric/vow/vat.js';
import { M } from '@endo/patterns';
import '@agoric/zoe/exported.js';
import { makeTracer } from '@agoric/internal';
import { withOrchestration } from '@agoric/orchestration/src/utils/start-helper.js';
import { ChainInfoShape } from '@agoric/orchestration/src/typeGuards.js';
import {
  InvitationShape,
  EmptyProposalShape,
} from '@agoric/zoe/src/typeGuards.js';
import * as flows from './ed-cert-flows.js';

const OrchestrationPowersShape = M.splitRecord({
  localchain: M.remotable('localchain'),
  orchestrationService: M.remotable('orchestrationService'),
  storageNode: M.remotable('storageNode'),
  timerService: M.remotable('timerService'),
  agoricNames: M.remotable('agoricNames'),
});

export const meta = {
  privateArgsShape: M.and(
    OrchestrationPowersShape,
    M.splitRecord({
      marshaller: M.remotable('marshaller'),
    }),
  ),
  customTermsShape: {
    chainDetails: M.recordOf(M.string(), ChainInfoShape),
  },
};
harden(meta);
const trace = makeTracer('EdCertContract');

const contract = async (
  zcf,
  privateArgs,
  zone,
  { orchestrateAll, zoeTools, chainHub, vowTools },
) => {
  trace('ed-cert start contract');

  const maxCertificates = 1000n;

  const timerService = privateArgs.timerService;
  
  // Create storage node for certificate data
  const certificateDataRoot = await E(privateArgs.storageNode).makeChildNode(
    'certificates',
  );

  // Context for flows
  const ctx = {
    vowTools: vowTools,
    certificateDataRoot: certificateDataRoot,
    getCurrentTimestamp() {

      return vowTools.asVow(async () => {
        const currentTimestamp = await E(timerService).getCurrentTimestamp();
        trace('Current Timestamp:', currentTimestamp);
        // Create storage node for certificate data
        const timeDataRoot = await E(privateArgs.storageNode).makeChildNode('time');
        const obj = { currentTimestamp: currentTimestamp };
        const objWithString = { currentTimestamp: obj.currentTimestamp.toString() };
        await E(timeDataRoot).setValue(JSON.stringify(objWithString));
        return currentTimestamp;
      });
    } ,
    maxCertificates: maxCertificates,
  };

  const { publishEdCert } = orchestrateAll(flows, ctx);

  const publicFacet = zone.exo(
    'EdCert Public Facet',
    M.interface('EdCert PF', {
      makePublishInvitation: M.callWhen().returns(InvitationShape),
    }),
    {
      makePublishInvitation() {
        return zcf.makeInvitation(
          publishEdCert,
          'Publish Certificate Data',
          undefined,
          EmptyProposalShape,
        );
      },
    },
  );

  return { publicFacet };
};

export const start = withOrchestration(contract);
harden(start);
