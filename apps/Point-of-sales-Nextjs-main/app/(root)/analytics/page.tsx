import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
const Page = () => {
  return (
    <div className="w-full h-full dark:bg-[#0F0F0F] flex flex-col items-center p-4">
      <div className="flex flex-col lg:flex-row justify-center items-center w-full h-full gap-4">
        <Card className="w-full lg:w-1/2 h-full flex flex-col">
          <CardHeader>
            <CardTitle>Product</CardTitle>
            <CardDescription>
              Discover insights and analytics about our diverse product range.
              Click the button below to explore detailed product analytics.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow pt-5">
            <div className="p-4">
              <svg viewBox="0 0 100 50" className="w-full h-auto">
                <line
                  x1="0"
                  y1="45"
                  x2="100"
                  y2="45"
                  stroke="black"
                  strokeWidth="0.5"
                />
                <line
                  x1="5"
                  y1="0"
                  x2="5"
                  y2="50"
                  stroke="black"
                  strokeWidth="0.5"
                />
                <polyline
                  fill="none"
                  stroke="blue"
                  strokeWidth="0.5"
                  points="5,45 15,30 25,25 35,20 45,15 55,10 65,5 75,8 85,12 95,10"
                />
                <circle cx="5" cy="45" r="1" fill="blue" />
                <circle cx="15" cy="30" r="1" fill="blue" />
                <circle cx="25" cy="25" r="1" fill="blue" />
                <circle cx="35" cy="20" r="1" fill="blue" />
                <circle cx="45" cy="15" r="1" fill="blue" />
                <circle cx="55" cy="10" r="1" fill="blue" />
                <circle cx="65" cy="5" r="1" fill="blue" />
                <circle cx="75" cy="8" r="1" fill="blue" />
                <circle cx="85" cy="12" r="1" fill="blue" />
                <circle cx="95" cy="10" r="1" fill="blue" />
              </svg>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href={'/analytics/product'}>Go</Link>
            </Button>
          </CardFooter>
        </Card>

        <Separator orientation="vertical" className="hidden lg:block" />
        <Card className="w-full lg:w-1/2 h-full flex flex-col">
          <CardHeader>
            <CardTitle>Income</CardTitle>
            <CardDescription>
              Track the income trends over the past quarters. Click the button
              below to explore detailed income analytics.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-grow pt-5">
            <div className="p-4">
              <svg viewBox="0 0 100 50" className="w-full h-auto">
                <line
                  x1="0"
                  y1="45"
                  x2="100"
                  y2="45"
                  stroke="black"
                  strokeWidth="0.5"
                />
                <line
                  x1="5"
                  y1="0"
                  x2="5"
                  y2="50"
                  stroke="black"
                  strokeWidth="0.5"
                />
                <polyline
                  fill="none"
                  stroke="blue"
                  strokeWidth="0.5"
                  points="5,45 15,40 25,35 35,30 45,25 55,20 65,15 75,20 85,25 95,30"
                />
                <circle cx="5" cy="45" r="1" fill="blue" />
                <circle cx="15" cy="40" r="1" fill="blue" />
                <circle cx="25" cy="35" r="1" fill="blue" />
                <circle cx="35" cy="30" r="1" fill="blue" />
                <circle cx="45" cy="25" r="1" fill="blue" />
                <circle cx="55" cy="20" r="1" fill="blue" />
                <circle cx="65" cy="15" r="1" fill="blue" />
                <circle cx="75" cy="20" r="1" fill="blue" />
                <circle cx="85" cy="25" r="1" fill="blue" />
                <circle cx="95" cy="30" r="1" fill="blue" />
              </svg>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" asChild>
              <Link href={'/analytics/income'}>Go</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default Page;
