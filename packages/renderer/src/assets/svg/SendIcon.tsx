import React from "react";

export function SendIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g clipPath="url(#clip0_5_1593)">
        <g filter="url(#filter0_d_5_1593)">
          <path
            d="M17.5652 10.7788C17.4087 11.1143 17.1421 11.3804 16.8228 11.5404L4.74987 17.6336C3.89338 18.0524 2.85983 17.7108 2.42514 16.8719C2.23381 16.4668 2.19501 16.0095 2.32747 15.583L3.64782 11.2847C3.76872 10.8912 4.13225 10.6225 4.54399 10.6225H9.16489C9.50454 10.6212 9.78227 10.3467 9.79002 9.99759C9.78788 9.65384 9.51356 9.37598 9.16489 9.37264H4.54739C4.13403 9.37264 3.76946 9.10192 3.64993 8.70622L2.347 4.39264C2.0744 3.493 2.58899 2.53344 3.4996 2.26393C3.92108 2.13143 4.37704 2.17165 4.7694 2.38112L16.8228 8.47428C17.6648 8.90434 18.0037 9.93915 17.5652 10.7788Z"
            fill="#127AF3"
          />
        </g>
      </g>
      <defs>
        <filter
          id="filter0_d_5_1593"
          x="0.249512"
          y="1.1875"
          width="19.5078"
          height="19.625"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feColorMatrix
            in="SourceAlpha"
            type="matrix"
            values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
            result="hardAlpha"
          />
          <feOffset dy="1" />
          <feGaussianBlur stdDeviation="1" />
          <feComposite in2="hardAlpha" operator="out" />
          <feColorMatrix
            type="matrix"
            values="0 0 0 0 0.725 0 0 0 0 0.852111 0 0 0 0 1 0 0 0 1 0"
          />
          <feBlend
            mode="normal"
            in2="BackgroundImageFix"
            result="effect1_dropShadow_5_1593"
          />
          <feBlend
            mode="normal"
            in="SourceGraphic"
            in2="effect1_dropShadow_5_1593"
            result="shape"
          />
        </filter>
        <clipPath id="clip0_5_1593">
          <rect width="20" height="20" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}
