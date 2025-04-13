import React from "react";

export interface ExpandIconProps {
  isExpanded: boolean;
  size?: number;
  color?: string;
  expandedColor?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export const ExpandIcon: React.FC<ExpandIconProps> = ({
  isExpanded,
  size = 16,
  color = "#666",
  expandedColor = "#333",
  onClick
}) => {
  return (
    <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        onClick={onClick}
        className="w-6 h-6 cursor-pointer transition-transform duration-200 ease-in-out transform"
    >
        <polygon points="8,6 8,18 16,12" fill={color} />
    </svg>
  );
}; 