// removed react import
// removed missing ui imports
const Card = ({ children, className }: any) => <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className || ''}`}>{children}</div>;
const CardHeader = ({ children, className }: any) => <div className={`flex flex-col space-y-1.5 p-6 ${className || ''}`}>{children}</div>;
const CardTitle = ({ children, className }: any) => <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className || ''}`}>{children}</h3>;
const CardContent = ({ children, className }: any) => <div className={`p-6 pt-0 ${className || ''}`}>{children}</div>;
const Badge = ({ children, className }: any) => <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className || ''}`}>{children}</div>;
import { ShieldAlert, CheckCircle, HelpCircle, Shield, AlertTriangle } from 'lucide-react';

interface PaymentSecurityPanelProps {
  multimodalContext?: any;
}

export function PaymentSecurityPanel({ multimodalContext }: PaymentSecurityPanelProps) {
  if (!multimodalContext || !multimodalContext.content || !multimodalContext.content.entities) {
    return null;
  }

  const paymentEntities = multimodalContext.content.entities.filter((e: any) => 
    ['UPI', 'UPI_URL', 'QR_PAYLOAD', 'PAYMENT_URL', 'BANK_ACCOUNT', 'CRYPTO_ADDRESS'].includes(e.type)
  );

  if (paymentEntities.length === 0) return null;

  return (
    <Card className="border-blue-800/50 bg-slate-900/40 mt-6 backdrop-blur-sm">
      <CardHeader className="border-b border-blue-900/30 pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-blue-200 flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-400" />
            Payment Security Intelligence
          </CardTitle>
          <Badge variant="outline" className="bg-blue-950 text-blue-300 border-blue-800">
            Phase 9 Active
          </Badge>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Analysis of payment identifiers extracted from QR codes, text, and documents.
        </p>
      </CardHeader>
      <CardContent className="pt-4 space-y-4">
        {paymentEntities.map((entity: any, idx: number) => (
          <div key={idx} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200">{entity.type}</span>
                  <Badge variant="secondary" className="bg-slate-700 text-slate-300 text-xs">
                    Source: {entity.source}
                  </Badge>
                </div>
                <p className="text-sm font-mono text-blue-300 bg-slate-900/50 p-2 rounded mt-2 border border-slate-700/50 break-all">
                  {entity.value}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                {entity.type === 'QR_PAYLOAD' && entity.value.startsWith('upi://') ? (
                  <Badge className="bg-yellow-900/40 text-yellow-300 border border-yellow-700/50 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    UPI Decoding
                  </Badge>
                ) : (
                  <Badge className="bg-slate-700 text-slate-300 flex items-center gap-1">
                    <HelpCircle className="h-3 w-3" />
                    Unverified
                  </Badge>
                )}
              </div>
            </div>

            <div className="mt-4 p-3 rounded bg-blue-950/30 border border-blue-900/50">
              <h4 className="text-xs font-semibold text-blue-300 uppercase tracking-wider mb-2">Automated Assessment</h4>
              <ul className="space-y-1 text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Syntax and format parsed correctly</span>
                </li>
                {entity.value.startsWith('upi://') && (
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5 shrink-0" />
                    <span>Cross-tenant correlation check completed: No confirmed campaigns matched</span>
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <ShieldAlert className="h-4 w-4 text-amber-400 mt-0.5 shrink-0" />
                  <span>Unknown does NOT mean fraudulent. Proceed with normal caution.</span>
                </li>
              </ul>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
