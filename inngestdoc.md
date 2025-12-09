Inngest invokes your functions securely via an API endpoint at /api/inngest. To enable that, you will create an Inngest client in your Next.js project, which you will use to send events and create functions.

Make a new directory next to your app directory (for example, src/inngest) where you'll define your Inngest functions and the client.

In the /src/inngest directory create an Inngest client:

src/inngest/client.ts

Copy
Copied
import { Inngest } from "inngest";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "my-app" });
Next, you will set up a route handler for the /api/inngest route. To do so, create a file inside your app directory (for example, at src/app/api/inngest/route.ts) with the following code:

src/app/api/inngest/route.ts

Copy
Copied
import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";

// Create an API that serves zero functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    /* your functions will be passed here later! */
  ],
});
4. Write your first Inngest function
In this step, you will write your first reliable serverless function. This function will be triggered whenever a specific event occurs (in our case, it will be test/hello.world). Then, it will sleep for a second and return a "Hello, World!".

Define the function
To define the function, use the createFunction method on the Inngest client.

Learn more: What is createFunction method?
Inside your src/inngest directory create a new file called functions.ts where you will define Inngest functions. Add the following code:

src/inngest/functions.ts

Copy
Copied
import { inngest } from "./client";

export const helloWorld = inngest.createFunction(
  { id: "hello-world" },
  { event: "test/hello.world" },
  async ({ event, step }) => {
    await step.sleep("wait-a-moment", "1s");
    return { message: `Hello ${event.data.email}!` };
  },
);
Add the function to
serve()
Next, import your Inngest function in the routes handler (src/app/api/inngest/route.ts) and add it to the serve handler so Inngest can invoke it via HTTP:

src/app/api/inngest/route.ts

Copy
Copied
import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { helloWorld } from "../../../inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    helloWorld, // <-- This is where you'll always add all your functions
  ],
});
👉 Note that you can import serve() for other frameworks and the rest of the code, in fact, remains the same — only the import statement changes (instead of inngest/next, it would be inngest/astro, inngest/remix, and so on).

Now, it's time to run your function!

5. Trigger your function from the Inngest Dev Server UI
Inngest is powered by events.You will trigger your function in two ways: first, by invoking it directly from the Inngest Dev Server UI, and then by sending events from code.

With your Next.js app and Inngest Dev Server running, open the Inngest Dev Server UI and select the "Functions" tab http://localhost:8288/functions. You should see your function. (Note: if you don't see any function, select the "Apps" tab to troubleshoot)

Inngest Dev Server web interface's functions tab with functions listed
To trigger your function, use the "Invoke" button for the associated function:

Inngest Dev Server web interface's functions tab with the invoke button highlighted
In the pop up editor, add your event payload data like the example below. This can be any JSON and you can use this data within your function's handler. Next, press the "Invoke Function" button:


Copy
Copied
{
  "data": {
    "email": "test@example.com"
  }
}
Inngest Dev Server web interface's invoke modal with payload editor and invoke submit button highlighted
The payload is sent to Inngest (which is running locally) which automatically executes your function in the background! You can see the new function run logged in the "Runs" tab:

Inngest Dev Server web interface's runs tab with a single completed run displayed
When you click on the run, you will see more information about the event, such as which function was triggered, its payload, output, and timeline:

Inngest Dev Server web interface's runs tab with a single completed run expanded
In this case, the payload triggered the hello-world function, which did sleep for a second and then returned "Hello, World!". No surprises here, that's what we expected!

Inngest Dev Server web interface's runs tab with a single completed run expanded indicating that hello-world function ran, that it slept for 1s, and that the correct body was returned
To aid in debugging your functions, you can quickly "Rerun" or "Cancel" a function. Try clicking "Rerun" at the top of the "Run details" table:

Run details expanded with rerun and cancel buttons highlighted
After the function was replayed, you will see two runs in the UI:

Inngest Dev Server web interface's runs tab with two runs listed
Now you will trigger an event from inside your app.

6. Trigger from code
Inngest is powered by events.

Learn more: events in Inngest.
To trigger Inngest functions to run in the background, you will need to send events from your application to Inngest. Once the event is received, it will automatically invoke all functions that are configured to be triggered by it.

To send an event from your code, you can use the Inngest client's send() method.

Learn more: send() method.
You will now send an event from within your Next.js app: from the “hello” Next.js API function. To do so, create a new API handler in the src/app/api/hello/route.ts file:

src/app/api/hello/route.ts

Copy
Copied
import { NextResponse } from "next/server";
import { inngest } from "../../../inngest/client"; // Import our client

// Opt out of caching; every request should send a new event
export const dynamic = "force-dynamic";

// Create a simple async Next.js API route handler
export async function GET() {
  // Send your event payload to Inngest
  await inngest.send({
    name: "test/hello.world",
    data: {
      email: "testUser@example.com",
    },
  });

  return NextResponse.json({ message: "Event sent!" });
}
👉 Note that we use "force-dynamic" to ensure we always send a new event on every request. In most situations, you'll probably want to send an event during a POST request so that you don't need this config option.

Every time this API route is requested, an event is sent to Inngest. To test it, open http://localhost:3000/api/hello (change your port if your Next.js app is running elsewhere). You should see the following output: {"message":"Event sent!"}

Web browser showing the JSON response of the /api/hello endpoint
If you go back to the Inngest Dev Server, you will see a new run is triggered by this event:

Inngest Dev Server web interface's runs tab with a third run triggered by the 'test/hello.world' event
And - that's it! You now have learned how to create Inngest functions and you have sent events to trigger those functions. Congratulations 🥳

Next Steps
To continue your exploration, feel free to check out:

Examples of what other people built with Inngest.
Case studies showcasing a variety of use cases.
Our blog where we explain how Inngest works, publish guest blog posts, and share our learnings.
You can also read more:

About Inngest functions.
About Inngest steps.
About Durable Execution
How to use Inngest with other frameworks.
How to deploy your app to your platform.