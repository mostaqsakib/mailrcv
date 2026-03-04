import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, CheckCircle, ArrowRight, Sparkles, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

const RedeemPage = () => {
  const { user, plan, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRedeem = async () => {
    if (!code.trim()) {
      toast.error("Enter a coupon code");
      return;
    }
    if (!user) {
      toast.error("Please sign in to redeem a coupon");
      navigate("/auth");
      return;
    }

    setRedeeming(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-coupon", {
        body: { action: "redeem", code: code.trim() },
      });
      if (error) throw error;
      if (data.error) {
        toast.error(data.error);
        setRedeeming(false);
        return;
      }
      setSuccess(data.message);
      toast.success(data.message);
      setCode("");
      await refreshProfile();
    } catch (e: any) {
      toast.error(e.message || "Failed to redeem coupon");
    }
    setRedeeming(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center px-4 pt-20 sm:pt-24 pb-8">
        <div className="max-w-md w-full">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="gap-2 text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          {success ? (
            <div className="text-center space-y-6 animate-slide-up">
              <div className="w-20 h-20 rounded-2xl bg-green-500/10 flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Coupon Redeemed!</h1>
              <p className="text-muted-foreground">{success}</p>
              <div className="flex flex-col gap-3">
                <Button onClick={() => { setSuccess(null); setCode(""); }} variant="outline">
                  Redeem Another Code
                </Button>
                <Button asChild className="gradient-bg text-primary-foreground gap-2">
                  <Link to="/"><Sparkles className="w-4 h-4" /> Start Using Pro Features</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-slide-up">
              {/* Header */}
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                  <Ticket className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Redeem Coupon</h1>
                <p className="text-muted-foreground">
                  Enter your coupon code to activate Pro features instantly
                </p>
              </div>

              {/* Current plan info */}
              {user && (
                <div className="p-3 rounded-xl glass text-center text-sm">
                  <span className="text-muted-foreground">Current plan: </span>
                  <span className="font-semibold text-foreground capitalize">{plan}</span>
                </div>
              )}

              {/* Redeem form */}
              <div className="space-y-4">
                <Input
                  placeholder="ENTER-COUPON-CODE"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="h-14 text-center font-mono text-lg tracking-widest border-primary/30 focus:border-primary"
                  onKeyDown={(e) => e.key === "Enter" && handleRedeem()}
                />
                <Button
                  onClick={handleRedeem}
                  disabled={redeeming || !code.trim()}
                  className="w-full h-12 gradient-bg text-primary-foreground font-semibold text-base gap-2"
                >
                  {redeeming ? (
                    <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      Redeem Code <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>

              {/* Sign in prompt */}
              {!user && (
                <p className="text-center text-sm text-muted-foreground">
                  You need to{" "}
                  <Link to="/auth" className="text-primary font-medium hover:underline">
                    sign in
                  </Link>{" "}
                  before redeeming a coupon
                </p>
              )}

              {/* Info */}
              <div className="text-center text-xs text-muted-foreground space-y-1">
                <p>Coupon codes are case-insensitive and single-use per account</p>
                <p>
                  <Link to="/pricing" className="text-primary hover:underline">
                    View plans →
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default RedeemPage;
