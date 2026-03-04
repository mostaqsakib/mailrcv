import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Check, Loader2, Clock, AlertCircle, CreditCard } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Gateway {
  id: string;
  gateway_type: string;
  display_name: string;
  is_active: boolean;
  config: Record<string, any>;
}

const CheckoutPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refreshProfile } = useAuth();
  const [orderId, setOrderId] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [paymentOrderId, setPaymentOrderId] = useState<string | null>(null);
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [loadingGateways, setLoadingGateways] = useState(true);
  const [selectedGateway, setSelectedGateway] = useState<string | null>(null);
  const [cryptomusLoading, setCryptomusLoading] = useState(false);

  const planType = searchParams.get("plan") || "monthly";
  const amount = planType === "lifetime" ? "10.00" : "1.00";
  const currency = "USDT";

  // Redirect if not logged in
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  // Load active gateways
  useEffect(() => {
    const loadGateways = async () => {
      const { data } = await supabase
        .from("payment_gateways")
        .select("*")
        .eq("is_active", true);
      
      setGateways((data as unknown as Gateway[]) || []);
      setLoadingGateways(false);
      
      // Auto-select if only one gateway
      if (data && data.length === 1) {
        setSelectedGateway((data[0] as unknown as Gateway).gateway_type);
      }
    };
    loadGateways();
  }, []);

  // Create Binance payment order
  const createBinanceOrder = async () => {
    if (!user) return;
    setCreatingOrder(true);

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

  // Handle Cryptomus payment
  const handleCryptomus = async () => {
    if (!user) return;
    setCryptomusLoading(true);

    try {
      const response = await supabase.functions.invoke("create-cryptomus-invoice", {
        body: {
          planType,
          returnUrl: window.location.origin + "/dashboard",
        },
      });

      if (response.error) {
        toast({ title: "Error", description: "Failed to create payment", variant: "destructive" });
        setCryptomusLoading(false);
        return;
      }

      if (response.data?.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        toast({ title: "Error", description: "No payment URL received", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
    setCryptomusLoading(false);
  };

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

  if (loadingGateways) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const binanceGateway = gateways.find((g) => g.gateway_type === "binance");
  const cryptomusGateway = gateways.find((g) => g.gateway_type === "cryptomus");
  const binancePayId = binanceGateway?.config?.pay_id || "526944888";
  const isExpired = timeLeft === "Expired";

  // Gateway selection screen
  if (!selectedGateway) {
    return (
      <div className="min-h-screen hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 grid-dots opacity-50" />
        <div className="relative z-10 p-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <ThemeToggle />
        </div>

        <div className="relative z-10 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Choose Payment Method</h2>
              <p className="text-muted-foreground">
                {planType === "lifetime" ? "Lifetime Pro" : "Monthly Pro"} — {amount} {planType === "lifetime" ? "USD" : "USDT"}
              </p>
            </div>

            <div className="space-y-3">
              {binanceGateway && (
                <button
                  onClick={() => {
                    setSelectedGateway("binance");
                    createBinanceOrder();
                  }}
                  className="w-full p-5 rounded-2xl glass-strong border border-border/50 flex items-center gap-4 hover:border-yellow-500/50 transition-all duration-200 text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center shrink-0">
                    <span className="text-yellow-500 font-bold text-lg">₿</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{binanceGateway.display_name}</p>
                    <p className="text-sm text-muted-foreground">Send USDT via Binance Pay • Manual verification</p>
                  </div>
                </button>
              )}

              {cryptomusGateway && (
                <button
                  onClick={() => {
                    setSelectedGateway("cryptomus");
                    handleCryptomus();
                  }}
                  disabled={cryptomusLoading}
                  className="w-full p-5 rounded-2xl glass-strong border border-border/50 flex items-center gap-4 hover:border-primary/50 transition-all duration-200 text-left disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">{cryptomusGateway.display_name}</p>
                    <p className="text-sm text-muted-foreground">Pay with any cryptocurrency • Auto verification</p>
                  </div>
                  {cryptomusLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
                </button>
              )}
            </div>

            {gateways.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>No payment methods available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Cryptomus loading state
  if (selectedGateway === "cryptomus") {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center flex-col gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Redirecting to payment...</p>
        <Button variant="outline" size="sm" onClick={() => setSelectedGateway(null)}>
          Choose another method
        </Button>
      </div>
    );
  }

  // Binance flow (creating order spinner)
  if (creatingOrder) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      <div className="absolute inset-0 grid-dots opacity-50" />

      {/* Header */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setSelectedGateway(null)} className="gap-2">
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
                    Open Binance App → Pay → Send to Binance User
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-foreground/80">Send to Binance ID:</span>
                    <span className="font-bold text-foreground">{binancePayId}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 px-2 text-xs gap-1"
                      onClick={() => copyToClipboard(binancePayId, "id")}
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
