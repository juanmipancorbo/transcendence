import { Children } from "react";

export default function StackLayout({ children }: { children: React.ReactNode }) {
	const count = Children.count(children);

	return <div className="pointer-events-none fixed right-2 bottom-2 z-[60]">
		{ Children.map(children, (child, i) => {
			return <div style={{
				transitionDuration: "0.15s",
				scale: `${100 - ((count - (i + 1)) * 2)}%`,
				translate: `0 -${(count - (i + 1)) * 4}px`
			}} className="pointer-events-auto w-120">{child}</div>
		}) }
	</div>;
}
