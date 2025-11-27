import React from "react";
import { assets, dummyTestimonial } from "../../assets/assets";

const TestimonialsSection = () => {
  return (
    <div className="pb-14 px-8 md:px-0">
      <div className="text-center mb-8">
        <h2 className="h2 text-white mb-4">Testimonials</h2>
        <p className="body text-white/80 max-w-2xl mx-auto">
          Hear from our learners as they share their journeys of
          transformation, success, and how our platform has made a
          difference in their lives.
        </p>
      </div>
      <div className="grid grid-cols-auto gap-8 mt-14">
        {dummyTestimonial.map((testimonial, index) => (
          <div
            key={index}
            className="text-sm text-left glass-card pb-6 rounded-xl shadow-[0px_14px_15px_0px] shadow-black/20 overflow-hidden backdrop-blur-xl border border-white/20"
          >
            <div className="flex items-center gap-4 px-5 py-4 bg-white/10 backdrop-blur-md">
              <img
                className="h-12 w-12 rounded-full"
                src={testimonial.image}
                alt={testimonial.name}
              />
              <div>
                <h4 className="h5 text-white">
                  {testimonial.name}
                </h4>
                <p className="body-small text-white/80">{testimonial.role}</p>
              </div>
            </div>
            <div className="p-5 pb-7">
              <div className="flex gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <img
                    className="h-5"
                    key={i}
                    src={
                      i < Math.floor(testimonial.rating)
                        ? assets.star
                        : assets.star_blank
                    }
                    alt="star"
                  />
                ))}
              </div>
              <p className="body text-white/90 mt-5">{testimonial.feedback}</p>
            </div>
            <div>
              <a href="#" className="text-blue-300 hover:text-blue-200 underline px-5 transition-colors">
                Read more
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TestimonialsSection;
