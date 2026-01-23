import { ConnectButton } from "@/components/ConnectButton";
import { InfoList } from "@/components/InfoList";
import { ActionButtonList } from "@/components/ActionButtonList";
import Image from 'next/image';

export default function Home() {

  return (
    <div className={"pages"}>
      <Image src="/reown.svg" alt="Reown" width={150} height={150} priority />
      <h1>Payroll-Backed Loan - Solana zkTLS Demo</h1>

      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '8px',
        maxWidth: '600px',
        margin: '20px auto'
      }}>
        <h3 style={{ marginTop: 0 }}>🔐 Secure Payroll Verification with zkTLS</h3>
        <p style={{ fontSize: '14px', lineHeight: '1.6' }}>
          This application demonstrates privacy-preserving payroll verification using 
          Reclaim Protocol&apos;s zkTLS technology. Verify your income securely without 
          sharing sensitive credentials.
        </p>
      </div>

      <ConnectButton />
      <ActionButtonList />
      <div className="advice">
        <p>
          This projectId only works on localhost. <br/>Go to <a href="https://dashboard.reown.com" target="_blank" className="link-button" rel="Reown Dashboard">Reown Dashboard</a> to get your own.
        </p>
        <p style={{ marginTop: '10px', fontSize: '14px' }}>
          📖 For zkTLS setup instructions, see <strong>ZKTLS_INTEGRATION.md</strong>
        </p>
      </div>
      <InfoList />
    </div>
  );
}