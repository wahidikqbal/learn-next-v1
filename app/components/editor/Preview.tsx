import Button, { ButtonProps } from '@/shared/ui/blocks/Button';

// interface PreviewProps {
//     label: string;
//     color: string;
//     href: string;
//     textColor: string;
// }

type PreviewProps = ButtonProps;


export default function Preview(props: PreviewProps) {
    return (
        <div className="flex items-center justify-center h-full">
            <Button {...props} />
        </div>
    );
}
