import React from "react";
import { assets } from "../../assets/assets";

const Companies = () => {
  const logos = [
    { src: assets.microsoft_logo, alt: "Microsoft" },
    { src: assets.walmart_logo, alt: "Walmart" },
    { src: assets.accenture_logo, alt: "Accenture" },
    { src: assets.adobe_logo, alt: "Adobe" },
    { src: assets.paypal_logo, alt: "Paypal" },
  ];

  return (
    <section className="py-12 md:py-16 px-8 md:px-16 lg:px-40 w-full">
      <div className="max-w-7xl mx-auto text-center space-y-6">
        <p className="body-large text-white/90 font-semibold">
          Trusted by professionals from industry-leading companies worldwide
        </p>
        <div className="relative w-full overflow-hidden py-6">
          <div className="flex items-center gap-10 md:gap-16 lg:gap-20 animate-marquee">
            {[...logos, ...logos].map((company, index) => (
              <div
                key={`${company.alt}-${index}`}
                className="relative group flex-shrink-0"
              >
                <img
                  src={company.src}
                  alt={company.alt}
                  className="w-24 md:w-32 lg:w-40 h-auto brightness-0 invert transition-all duration-400 group-hover:brightness-100 group-hover:invert-0 object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Companies;
