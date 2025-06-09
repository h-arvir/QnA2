import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

// Optional: Replace these if you don't have these hooks/components
// import useDetectBrowser from "@/hooks/use-detect-browser";
// import useScreenSize from "@/hooks/use-screen-size";
// import { Button } from "@/components/ui/button";
// import GooeySvgFilter from "@/fancy/components/filter/gooey-svg-filter";

const TAB_CONTENT = [
  {
    title: "2024",
    files: [
      "learning-to-meditate.md",
      "spring-garden-plans.md",
      "travel-wishlist.md",
      "new-coding-projects.md",
    ],
  },
  {
    title: "2023",
    files: [
      "year-in-review.md",
      "marathon-training-log.md",
      "recipe-collection.md",
      "book-reflections.md",
    ],
  },
  {
    title: "2022",
    files: [
      "moving-to-a-new-city.md",
      "starting-a-blog.md",
      "photography-basics.md",
      "first-coding-project.md",
    ],
  },
  {
    title: "2021",
    files: [
      "goals-and-aspirations.md",
      "daily-gratitude.md",
      "learning-to-cook.md",
      "remote-work-journal.md",
    ],
  },
];

export default function GooeyDemo() {
  const [activeTab, setActiveTab] = useState(0);
  const [isGooeyEnabled, setIsGooeyEnabled] = useState(true);

  // Mock values (since hooks were TS + aliases)
  const screenSizeLessThanMd = false;
  const isSafari = false;

  return (
    <div className="relative w-dvw h-dvh flex justify-center p-8 font-calendas md:text-base text-xs sm:text-sm bg-white dark:bg-black">
      {/* If you have GooeySvgFilter component, enable below */}
      {/* <GooeySvgFilter id="gooey-filter" strength={screenSizeLessThanMd ? 8 : 15} /> */}

      <button
        onClick={() => setIsGooeyEnabled(!isGooeyEnabled)}
        className="absolute top-4 left-4 font-overused-grotesk border border-gray-400 px-3 py-1 rounded"
      >
        {isGooeyEnabled ? "Disable filter" : "Enable filter"}
      </button>

      <div className="w-11/12 md:w-4/5 relative mt-24">
        <div
          className="absolute inset-0"
          style={{ filter: isGooeyEnabled ? "url(#gooey-filter)" : "none" }}
        >
          <div className="flex w-full">
            {TAB_CONTENT.map((_, index) => (
              <div key={index} className="relative flex-1 h-8 md:h-12">
                {activeTab === index && (
                  <motion.div
                    layoutId="active-tab"
                    className="absolute inset-0 bg-[#efefef]"
                    transition={{
                      type: "spring",
                      bounce: 0.0,
                      duration: isSafari ? 0 : 0.4,
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="w-full h-[200px] sm:h-[250px] md:h-[300px] bg-[#efefef] overflow-hidden text-muted-foreground">
            <AnimatePresence mode="popLayout">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 50, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -50, filter: "blur(10px)" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                className="p-8 md:p-12"
              >
                <div className="space-y-2 mt-4 sm:mt-8 md:mt-8">
                  <ul>
                    {TAB_CONTENT[activeTab].files.map((file) => (
                      <li
                        key={file}
                        className="border-b border-muted-foreground/50 pt-2 pb-1 text-black"
                      >
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="relative flex w-full">
          {TAB_CONTENT.map((tab, index) => (
            <button
              key={index}
              onClick={() => setActiveTab(index)}
              className="flex-1 h-8 md:h-12"
            >
              <span
                className={`w-full h-full flex items-center justify-center ${
                  activeTab === index ? "text-black" : "text-muted-foreground"
                }`}
              >
                {tab.title}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}