import React from "react";
import { 
  User, 
  Laptop, 
  Server, 
  Cpu, 
  Send, 
  MailCheck,
  ChevronRight
} from "lucide-react";
import { FlowStep } from "../types";

interface FlowVisualizerProps {
  currentStep: FlowStep;
}

export default function FlowVisualizer({ currentStep }: FlowVisualizerProps) {
  // Define active nodes based on current execution step
  const getStepStatus = (node: string) => {
    switch (node) {
      case "User":
        return currentStep !== "idle" && currentStep !== "failed";
      case "Frontend":
        return ["requesting", "verifying", "sent", "verified"].includes(currentStep);
      case "Backend":
        return ["generating", "sending", "sent", "verifying", "verified"].includes(currentStep);
      case "Generate OTP":
        return ["generating", "sending", "sent", "verified"].includes(currentStep);
      case "Resend/Brevo":
        return ["sending", "sent"].includes(currentStep);
      case "Email arrives":
        return ["sent"].includes(currentStep);
      default:
        return false;
    }
  };

  const nodes = [
    { id: "User", label: "User", sub: "Session Initiator", icon: User },
    { id: "Frontend", label: "Frontend", sub: "Vite + React SPA", icon: Laptop },
    { id: "Backend", label: "Backend", sub: "Express Node.js", icon: Server },
    { id: "Generate OTP", label: "Generate OTP", sub: "In-Memory Secure Engine", icon: Cpu },
    { id: "Resend/Brevo", label: "Resend / Brevo", sub: "SMTP API Delivery", icon: Send },
    { id: "Email arrives", label: "Email arrives", sub: "User's Inbox", icon: MailCheck },
  ];

  return (
    <div id="flow-visualizer-card" className="bg-[#141414] border border-white/10 p-6 rounded-none relative overflow-hidden">
      {/* Background grid accent */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-light text-lg text-white tracking-wide">
              Architectural Pipeline Visualizer
            </h3>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mt-1">
              Active tracking of the requested message transmission cycle
            </p>
          </div>
          <div className="px-2.5 py-1 bg-white/5 border border-white/10 rounded-none">
            <span className="text-[9px] font-mono text-white/60 uppercase tracking-widest flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${currentStep === "verified" ? "bg-emerald-500 animate-pulse" : currentStep === "failed" ? "bg-rose-500 animate-pulse" : currentStep !== "idle" ? "bg-amber-500 animate-pulse" : "bg-white/30"}`} />
              System State: {currentStep.toUpperCase()}
            </span>
          </div>
        </div>

        {/* Desktop Flow Diagram */}
        <div className="hidden lg:grid grid-cols-6 gap-2 items-center relative py-6">
          {nodes.map((node, index) => {
            const isActive = getStepStatus(node.id);
            const Icon = node.icon;
            const isLast = index === nodes.length - 1;

            return (
              <React.Fragment key={node.id}>
                <div 
                  id={`node-${node.id.toLowerCase().replace('/', '-')}`}
                  className={`flex flex-col items-center justify-between p-4 border transition-all duration-300 relative ${
                    isActive 
                      ? "bg-white/5 border-white text-white shadow-[0_0_15px_rgba(255,255,255,0.08)] scale-102" 
                      : "bg-[#0A0A0A] border-white/10 text-white/40"
                  }`}
                >
                  {/* Subtle node index */}
                  <span className="absolute top-1.5 left-2 text-[8px] font-mono text-white/30">
                    0{index + 1}
                  </span>

                  <div className={`p-2.5 rounded-none border mb-3 transition-colors duration-300 ${isActive ? "border-white/20 bg-white/10" : "border-white/5 bg-white/2"}`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <span className="font-display font-medium text-xs tracking-wide text-center">
                    {node.label}
                  </span>
                  <span className="text-[9px] font-mono text-center text-white/30 mt-1 line-clamp-1">
                    {node.sub}
                  </span>
                </div>

                {!isLast && (
                  <div className="flex justify-center items-center">
                    <div className="relative w-full h-1 flex items-center justify-center">
                      {/* Connection Line */}
                      <div className={`absolute inset-0 h-[1px] transition-colors duration-300 ${isActive && getStepStatus(nodes[index + 1].id) ? "bg-white" : "bg-white/10"}`} />
                      
                      {/* Active traveling pulse */}
                      {isActive && !getStepStatus(nodes[index + 1].id) && (
                        <div className="absolute w-2 h-2 bg-white rounded-full animate-ping" />
                      )}
                      
                      <ChevronRight className={`w-3.5 h-3.5 transition-colors duration-300 z-10 ${isActive && getStepStatus(nodes[index + 1].id) ? "text-white" : "text-white/20"}`} />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Mobile / Compact Vertical Flow Diagram */}
        <div className="lg:hidden flex flex-col space-y-3.5 py-2">
          {nodes.map((node, index) => {
            const isActive = getStepStatus(node.id);
            const Icon = node.icon;
            const isLast = index === nodes.length - 1;

            return (
              <div key={node.id} className="flex flex-col">
                <div 
                  id={`node-mob-${node.id.toLowerCase().replace('/', '-')}`}
                  className={`flex items-center gap-4 p-3 border transition-all duration-300 ${
                    isActive 
                      ? "bg-white/5 border-white text-white shadow-[0_0_12px_rgba(255,255,255,0.05)]" 
                      : "bg-[#0A0A0A] border-white/10 text-white/40"
                  }`}
                >
                  <div className={`p-2 border ${isActive ? "border-white/20 bg-white/10" : "border-white/5 bg-white/2"}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-baseline justify-between">
                      <span className="font-display font-medium text-xs tracking-wide">
                        {node.label}
                      </span>
                      <span className="text-[8px] font-mono text-white/30">
                        0{index + 1}
                      </span>
                    </div>
                    <p className="text-[9px] font-mono text-white/30 mt-0.5">
                      {node.sub}
                    </p>
                  </div>
                </div>

                {!isLast && (
                  <div className="flex justify-center h-4 items-center">
                    <div className={`w-[1px] h-full ${isActive && getStepStatus(nodes[index + 1].id) ? "bg-white" : "bg-white/10"}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
