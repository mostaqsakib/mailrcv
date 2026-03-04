import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Check, Loader2, Clock, AlertCircle } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const BINANCE_PAY_ID = "526944888";

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const [orderId, setOrderId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(true);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState("");

  const planType = searchParams.get("plan") || "monthly";
  const amount = planType === "lifetime" ? "10.00" : "1.00";
  const currency = "USDT";

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Create payment order on mount
  useEffect(() => {
    if (!user) return;

    const createOrder = async () => {
      const { data, error } = await supabase
        .from("payment_orders")
        .insert({
          user_id: user.id,
          plan_type: "paid",
          amount: parseFloat(amount),
          currency,
          payment_method: "binance",
          status: "pending",
        })
        .select()
        .single();

      if (error) {
        toast({ title: "Error", description: "Failed to create payment order", variant: "destructive" });
        navigate("/pricing");
        return;
      }

      setPaymentOrderId(data.id);
      setExpiresAt(new Date(data.expires_at));
      setCreatingOrder(false);
    };

    createOrder();
  }, [user, amount, currency, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const now = new Date();
      const diff = expiresAt.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Expired");
        clearInterval(interval);
        return;
      }

      const minutes = Math.floor(diff / 60000);
      const seconds = Math.floor((diff % 60000) / 1000);
      setTimeLeft(`${minutes}:${seconds.toString().padStart(2, "0")}`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleVerify = async () => {
    if (!orderId.trim() || !paymentOrderId) return;

    setVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({ title: "Error", description: "Please log in again", variant: "destructive" });
        navigate("/auth");
        return;
      }

      const response = await supabase.functions.invoke("verify-binance-payment", {
        body: { orderId: orderId.trim(), paymentOrderId },
      });

      if (response.error) {
        const errorData = JSON.parse(response.error.message || "{}");
        toast({
          title: "Verification Failed",
          description: errorData.error || "Could not verify payment. Please try again.",
          variant: "destructive",
        });
      } else if (response.data?.success) {
        await refreshProfile();
        toast({
          title: "🎉 Payment Verified!",
          description: response.data.lifetime
            ? "Your Pro plan is now active forever!"
            : "Your Pro plan is now active for 30 days!",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Verification Failed",
          description: response.data?.error || "Could not verify payment.",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  };

  if (creatingOrder) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const isExpired = timeLeft === "Expired";

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      <div className="absolute inset-0 grid-dots opacity-50" />

      {/* Header */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")} className="gap-2">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg">
          {/* Card */}
          <div className="glass-strong rounded-2xl border border-border/50 overflow-hidden">
            {/* Timer bar */}
            <div className={`flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium ${
              isExpired 
                ? "bg-destructive/20 text-destructive" 
                : "bg-primary/10 text-primary"
            }`}>
              <Clock className="w-4 h-4" />
              {isExpired ? "Payment window expired" : `Verify within ${timeLeft}`}
            </div>

            {/* Binance header */}
            <div className="flex items-center justify-center py-6 border-b border-border/30">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center">
                  <span className="text-white font-bold text-sm">₿</span>
                </div>
                <span className="text-xl font-bold text-yellow-500">BINANCE</span>
              </div>
            </div>

            {/* Amount & merchant info */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <span className="text-primary font-bold text-sm">MR</span>
                </div>
                <span className="font-semibold text-foreground">Mail Rcv</span>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold text-foreground">{amount} {currency}</div>
                <div className="text-xs text-muted-foreground">
                  {planType === "lifetime" ? "Lifetime Pro" : "Monthly Pro"}
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="px-6 py-5 space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span className="text-foreground/80">
                    Open Binance App → Pay → Send to Binance User or <span className="font-semibold text-primary">Click here</span>
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-foreground/80">Send to Binance ID:</span>
                    <span className="font-bold text-foreground">{BINANCE_PAY_ID}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => copyToClipboard(BINANCE_PAY_ID, "id")}
                    >
                      {copiedField === "id" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedField === "id" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-foreground/80">Enter the Amount:</span>
                    <span className="font-bold text-foreground">{amount} {currency}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => copyToClipboard(amount, "amount")}
                    >
                      {copiedField === "amount" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copiedField === "amount" ? "Copied" : "Copy"}
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span className="text-foreground/80">Complete The Payment</span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <span className="text-foreground/80">
                    Enter the <span className="font-bold">Order ID</span> in the box below and click <span className="font-bold">Verify</span>
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-yellow-500 mt-1.5 shrink-0" />
                  <span className="text-yellow-600 dark:text-yellow-400 text-xs">
                    Note: Please verify within 15 minutes of making your payment
                  </span>
                </div>
              </div>

              {/* Order ID input */}
              <div className="pt-2 space-y-2">
                <label className="text-sm font-medium text-foreground">Order ID</label>
                <Input
                  placeholder="Enter Order ID"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  variant="glass"
                  disabled={isExpired}
                />
              </div>

              {/* Verify button */}
              <Button
                className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600"
                onClick={handleVerify}
                disabled={!orderId.trim() || verifying || isExpired}
              >
                {verifying ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...
                  </>
                ) : (
                  "Verify"
                )}
              </Button>

              {isExpired && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>This payment window has expired. Please go back and try again.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
