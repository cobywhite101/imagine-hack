import { CustomersGrid } from "@/features/customers/CustomersGrid";

export function CustomerHub() {
  return (
    <div className="flex h-full flex-col">
      <header className="flex h-[49px] w-[1165px] shrink-0 items-center justify-start gap-[6px] overflow-hidden bg-white px-3 py-2.5 text-[10px] leading-[15px] text-black shadow-[inset_0_-1px_0_0_rgb(238,239,241)] transition-all">
        <div className="flex h-7 w-[1141px] items-center justify-between gap-1 transition-all">
          <div className="flex h-5 w-[68.9766px] items-center justify-start gap-[6px] py-0 pl-1 pr-[6px] transition-all">
            <svg
              className="h-[14px] w-[14px] overflow-hidden text-[#101112] transition-all"
              height="14px"
              width="14px"
              viewBox="0 0 14 14"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M5.41699 1.14917C6.33787 0.395804 7.66213 0.395804 8.58301 1.14917L11.8994 3.86304C12.5957 4.43275 12.9999 5.28467 13 6.18433V9.99976C13 11.6566 11.6569 12.9998 10 12.9998H4C2.34315 12.9998 1 11.6566 1 9.99976V6.18433C1.0001 5.28467 1.40429 4.43275 2.10059 3.86304L5.41699 1.14917ZM7.9502 1.92261C7.39768 1.47063 6.60232 1.47063 6.0498 1.92261L2.7334 4.63647C2.26924 5.01626 2.0001 5.5846 2 6.18433V9.99976C2 11.1043 2.89543 11.9998 4 11.9998H10C11.1046 11.9998 12 11.1043 12 9.99976V6.18433C11.9999 5.5846 11.7308 5.01626 11.2666 4.63647L7.9502 1.92261ZM9.5 8.99976C9.77607 8.99976 9.99989 9.22371 10 9.49976C10 9.7759 9.77614 9.99976 9.5 9.99976H4.5C4.22386 9.99976 4 9.7759 4 9.49976C4.00011 9.22371 4.22393 8.99976 4.5 8.99976H9.5Z"
                fill="currentColor"
              />
            </svg>
            <div className="h-5 w-[38.9766px] text-[14px] font-medium leading-5 tracking-[-0.14px] text-[#101112] transition-all">
              Home
            </div>
          </div>
        </div>
      </header>

      <div className="min-h-0 flex-1 overflow-hidden bg-card p-6">
        <CustomersGrid />
      </div>
    </div>
  );
}
