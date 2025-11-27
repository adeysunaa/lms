import React from "react";
import { assets } from "../../assets/assets";
import { useClerk } from "@clerk/clerk-react";

const CallToAction = () => {
  const { openSignIn } = useClerk();

  return (
    <section className="py-20 md:py-32 px-8 md:px-16 lg:px-40 w-full relative">
      {/* Background glow effect */}
      {/* <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/10 to-transparent pointer-events-none"></div> */}

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div className="glass-card rounded-3xl p-8 md:p-12 backdrop-blur-xl">
          <div className="inline-block mb-6">
            <span className="glass-light px-4 py-1.5 rounded-full body-small text-white/90">
              <i className="ri-rocket-line text-blue-300 mr-1"></i>
              Ready to Start?
            </span>
          </div>

          <h2 className="h2 text-white mb-6 text-center tracking-tight">
            Learn anything,
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 text-transparent bg-clip-text animate-gradient [background-size:240%_auto] font-bold text-[1.08em] leading-tight tracking-tight inline-block mt-1">
              Anytime, Anywhere
            </span>
          </h2>

          <p className="body-large text-white/90 max-w-2xl mx-auto mb-8 text-center">
            Join thousands of learners who are transforming their careers and
            achieving their goals with our comprehensive course library.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 mt-8">
            <button
              onClick={() => openSignIn()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 px-8 md:px-12 py-4 rounded-full text-white font-semibold text-base md:text-lg hover:scale-105 transition-all duration-300 shadow-xl w-full sm:w-auto flex items-center justify-center gap-2 border border-white/30"
            >
              Get Started Free
              <i className="ri-arrow-right-line text-xl"></i>
            </button>
            <button className="bg-white/10 px-8 md:px-12 py-4 rounded-full text-white font-semibold text-base md:text-lg hover:scale-105 transition-all duration-300 w-full sm:w-auto flex items-center justify-center gap-2 border border-white/20 backdrop-blur-md">
              <i className="ri-play-circle-line text-xl"></i>
              Watch Demo
            </button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-10 pt-8 border-t border-white/10">
            <div className="flex items-center gap-2 text-white/80 body-small">
              <i className="ri-shield-check-fill text-green-300 text-lg"></i>
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 body-small">
              <i className="ri-time-line text-blue-300 text-lg"></i>
              <span>Start Learning in Minutes</span>
            </div>
            <div className="flex items-center gap-2 text-white/80 body-small">
              <i className="ri-refund-2-line text-purple-300 text-lg"></i>
              <span>30-Day Money Back</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
