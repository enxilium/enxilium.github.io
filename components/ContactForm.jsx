import { useForm, ValidationError } from "@formspree/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@components/ui/textarea";

export default function ContactForm() {
  // const [state, handleSubmit] = useForm("xldrrnvw");
  const [formState, submit] = useForm(process.env.NEXT_PUBLIC_CONTACT_FORM);

  if (state.succeeded) {
    return <p>Thank you for your message! I will get back to you shortly.</p>;
  }

  return (
    <form className="flex flex-col gap-6 p-10 bg-[#27272c] rounded-xl" onSubmit={handleSubmit}>
        <h3 className="text-4xl text-accent">Contact Me</h3>
        <p className="text-white/60">
            Hey there! If there's anything you need to contact me about, please fill out the form below and I will get back to you as soon as possible. Looking forward to hearing from you!
        </p>
        {/* form inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input type="firstname" placeholder="First name" id="firstname" name="firstname"/> 

            <Input type="lastname" placeholder="Last name" id="lastname" name="lastname"/>

            <Input type="email" placeholder="Email address" id="email" name="email"/>
            <ValidationError prefix="Email" field="email" errors={state.errors} />

            <Input type="phone" placeholder="Phone number" id="phone" name="phone"/>
        </div>
        {/* form textarea */}
        <Textarea
            className="h-[200px]"
            placeholder="Enter your message..."
            id="message"
            name="message"
        />
        <ValidationError prefix="Message" field="message" errors={state.errors} />

        <Button type="submit" disabled={state.submitting} size="md" className="text-black max-w-40 h-9 px-4 bg-accent ontext-primary-foreground shadow hover:bg-accent/80 rounded-2xl">Send</Button>
        <ValidationError errors={state.errors} />
    </form>
  );
}
