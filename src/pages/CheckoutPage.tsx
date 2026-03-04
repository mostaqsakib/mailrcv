import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Check, Loader2, Clock, AlertCircle, CreditCard, Sparkles } from "lucide-react";
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

const GatewayCard = ({
  icon,
  iconBg,
  title,
  subtitle,
  onClick,
  disabled,
  loading,
  accentColor = "primary",
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle: string;
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  accentColor?: string;
}) => {
  const cardRef = useRef<HTMLButtonElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  return (
    <button
      ref={cardRef}
      onClick={onClick}
      disabled={disabled}
      onMouseMove={handleMouseMove}
      className="group relative w-full p-[1px] rounded-2xl transition-all duration-500 disabled:opacity-50"
    >
      {/* Conic gradient border */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `conic-gradient(from 0deg at ${mousePos.x}px ${mousePos.y}px, hsl(var(--${accentColor}) / 0.6), hsl(var(--accent) / 0.3), transparent 40%)`,
        }}
      />
      <div className="absolute inset-[1px] rounded-2xl bg-card/95 backdrop-blur-xl" />

      {/* Spotlight */}
      <div
        className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--${accentColor}) / 0.06), transparent 60%)`,
        }}
      />

      <div className="relative z-10 flex items-center gap-4 p-5 text-left">
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0 shadow-lg`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {loading && <Loader2 className="w-5 h-5 animate-spin text-primary shrink-0" />}
      </div>

      {/* Bottom shine */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </button>
  );
};

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

  const binanceCardRef = useRef<HTMLDivElement>(null);
  const [binanceMousePos, setBinanceMousePos] = useState({ x: 0, y: 0 });

  const handleBinanceMouseMove = useCallback((e: React.MouseEvent) => {
    if (!binanceCardRef.current) return;
    const rect = binanceCardRef.current.getBoundingClientRect();
    setBinanceMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  const planType = searchParams.get("plan") || "monthly";
  const amount = planType === "lifetime" ? "10.00" : "1.00";
  const currency = "USDT";

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user, navigate]);

  useEffect(() => {
    const loadGateways = async () => {
      const { data } = await supabase
        .from("payment_gateways")
        .select("*")
        .eq("is_active", true);
      setGateways((data as unknown as Gateway[]) || []);
      setLoadingGateways(false);
      if (data && data.length === 1) {
        setSelectedGateway((data[0] as unknown as Gateway).gateway_type);
      }
    };
    loadGateways();
  }, []);

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

  const handleCryptomus = async () => {
    if (!user) return;
    setCryptomusLoading(true);
    try {
      const response = await supabase.functions.invoke("create-cryptomus-invoice", {
        body: { planType, returnUrl: window.location.origin + "/dashboard" },
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
    } catch {
      toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
    }
    setCryptomusLoading(false);
  };

  useEffect(() => {
    if (!expiresAt) return;
    const interval = setInterval(() => {
      const diff = expiresAt.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); clearInterval(interval); return; }
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
        toast({ title: "Verification Failed", description: errorData.error || "Could not verify payment.", variant: "destructive" });
      } else if (response.data?.success) {
        await refreshProfile();
        toast({
          title: "🎉 Payment Verified!",
          description: response.data.lifetime ? "Your Pro plan is now active forever!" : "Your Pro plan is now active for 30 days!",
        });
        navigate("/dashboard");
      } else {
        toast({ title: "Verification Failed", description: response.data?.error || "Could not verify payment.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setVerifying(false);
    }
  };

  if (loadingGateways) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="relative">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full" />
        </div>
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

        {/* Aurora blobs */}
        <div className="absolute top-20 left-1/4 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-1/4 w-48 h-48 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />

        <div className="relative z-10 p-4 flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/pricing")} className="gap-2 hover:bg-secondary/60">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <ThemeToggle />
        </div>

        <div className="relative z-10 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-lg space-y-8 animate-fade-in">
            {/* Header */}
            <div className="text-center space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                Secure Payment
              </div>
              <h2 className="text-3xl font-bold text-foreground">Choose Payment Method</h2>
              <p className="text-muted-foreground text-lg">
                {planType === "lifetime" ? "Lifetime Pro" : "Monthly Pro"} — <span className="font-semibold text-foreground">{amount}</span> {planType === "lifetime" ? "USD" : "USDT"}
              </p>
            </div>

            <div className="space-y-4">
              {binanceGateway && (
                <GatewayCard
                  icon={<span className="text-yellow-400 font-bold text-lg">₿</span>}
                  iconBg="bg-gradient-to-br from-yellow-500/30 to-amber-600/20"
                  title={binanceGateway.display_name}
                  subtitle="Send USDT via Binance Pay • Manual verification"
                  accentColor="accent"
                  onClick={() => {
                    setSelectedGateway("binance");
                    createBinanceOrder();
                  }}
                />
              )}

              {cryptomusGateway && (
                <GatewayCard
                  icon={<CreditCard className="w-6 h-6 text-primary" />}
                  iconBg="bg-gradient-to-br from-primary/30 to-primary/10"
                  title={cryptomusGateway.display_name}
                  subtitle="Pay with any cryptocurrency • Auto verification"
                  loading={cryptomusLoading}
                  disabled={cryptomusLoading}
                  onClick={() => {
                    setSelectedGateway("cryptomus");
                    handleCryptomus();
                  }}
                />
              )}
            </div>

            {gateways.length === 0 && (
              <div className="text-center py-10 text-muted-foreground glass-strong rounded-2xl border border-border/50 backdrop-blur-xl">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 text-muted-foreground/60" />
                <p>No payment methods available at the moment.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Cryptomus loading
  if (selectedGateway === "cryptomus") {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center flex-col gap-4">
        <div className="relative">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full" />
        </div>
        <p className="text-muted-foreground animate-fade-in">Redirecting to payment...</p>
        <Button variant="outline" size="sm" onClick={() => setSelectedGateway(null)} className="animate-fade-in" style={{ animationDelay: "0.3s" }}>
          Choose another method
        </Button>
      </div>
    );
  }

  // Binance creating order
  if (creatingOrder) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="relative">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <div className="absolute inset-0 blur-xl bg-primary/20 rounded-full" />
        </div>
      </div>
    );
  }

  // Binance payment flow
  return (
    <div className="min-h-screen hero-gradient relative overflow-hidden">
      <div className="absolute inset-0 grid-dots opacity-50" />

      {/* Aurora blobs */}
      <div className="absolute top-10 right-1/4 w-72 h-72 bg-yellow-500/8 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-1/3 w-56 h-56 bg-primary/8 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />

      {/* Header */}
      <div className="relative z-10 p-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => setSelectedGateway(null)} className="gap-2 hover:bg-secondary/60">
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>
        <ThemeToggle />
      </div>

      <div className="relative z-10 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-lg animate-fade-in">
          {/* Main card with interactive border */}
          <div
            ref={binanceCardRef}
            onMouseMove={handleBinanceMouseMove}
            className="group relative p-[1px] rounded-2xl"
          >
            {/* Conic gradient border */}
            <div
              className="absolute inset-0 rounded-2xl opacity-40 group-hover:opacity-100 transition-opacity duration-700"
              style={{
                background: `conic-gradient(from 180deg at ${binanceMousePos.x}px ${binanceMousePos.y}px, hsl(43 90% 55% / 0.5), hsl(var(--primary) / 0.3), hsl(43 90% 55% / 0.2), transparent 50%)`,
              }}
            />
            <div className="absolute inset-[1px] rounded-2xl bg-card/95 backdrop-blur-xl" />

            {/* Spotlight glow */}
            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{
                background: `radial-gradient(400px circle at ${binanceMousePos.x}px ${binanceMousePos.y}px, hsl(43 90% 55% / 0.04), transparent 60%)`,
              }}
            />

            <div className="relative z-10 overflow-hidden rounded-2xl">
              {/* Timer bar */}
              <div className={`flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium backdrop-blur-sm ${
                isExpired
                  ? "bg-destructive/15 text-destructive border-b border-destructive/20"
                  : "bg-yellow-500/10 text-yellow-500 border-b border-yellow-500/20"
              }`}>
                <Clock className="w-4 h-4" />
                {isExpired ? "Payment window expired" : `Verify within ${timeLeft}`}
              </div>

              {/* Binance header */}
              <div className="flex items-center justify-center py-6 border-b border-border/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-yellow-500/20">
                    <span className="text-white font-bold text-sm">₿</span>
                  </div>
                  <span className="text-xl font-bold bg-gradient-to-r from-yellow-400 to-amber-500 bg-clip-text text-transparent">BINANCE</span>
                </div>
              </div>

              {/* Amount & merchant */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-border/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
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
                  {[
                    { text: "Open Binance App → Pay → Send to Binance User", color: "primary" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className={`w-2 h-2 rounded-full bg-${item.color} mt-1.5 shrink-0`} />
                      <span className="text-foreground/80">{item.text}</span>
                    </div>
                  ))}

                  <div className="flex items-start gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-foreground/80">Send to Binance ID:</span>
                      <span className="font-bold text-foreground">{binancePayId}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2 text-xs gap-1 border-border/50 hover:border-primary/30"
                        onClick={() => copyToClipboard(binancePayId, "id")}
                      >
                        {copiedField === "id" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
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
                        className="h-7 px-2 text-xs gap-1 border-border/50 hover:border-primary/30"
                        onClick={() => copyToClipboard(amount, "amount")}
                      >
                        {copiedField === "amount" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
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
                      Enter the <span className="font-bold text-foreground">Order ID</span> below and click <span className="font-bold text-foreground">Verify</span>
                    </span>
                  </div>

                  <div className="flex items-start gap-2 mt-1 p-2.5 rounded-lg bg-yellow-500/5 border border-yellow-500/10">
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
                    className="h-11"
                  />
                </div>

                {/* Verify button */}
                <Button
                  className="w-full h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-yellow-500 to-amber-600 text-white hover:from-yellow-400 hover:to-amber-500 shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 transition-all duration-300 hover:scale-[1.01] active:scale-[0.99]"
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
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 rounded-lg p-3 border border-destructive/20">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>This payment window has expired. Please go back and try again.</span>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom shine */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-500" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
